"""
CSV/Excel ingestion service.
Accepts uploaded files, parses with pandas, validates, and bulk-inserts.
"""
from __future__ import annotations
import io
import uuid
from datetime import datetime, timezone
from typing import List

import pandas as pd
from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text


# Required columns in the uploaded file (case-insensitive)
REQUIRED_COLUMNS = {"timestamp", "tenant_name", "category", "amount"}

# Optional columns with defaults
OPTIONAL_DEFAULTS = {
    "member_tier":    "Non-Member",
    "gender":         None,
    "payment_method": None,
}



def normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Aggressively map unknown/messy columns to the required schema."""
    df.columns = [str(c).strip().lower() for c in df.columns]
    
    mapping = {
        "timestamp (date)": "timestamp",
        "date":             "timestamp",
        "trans date":       "timestamp",
        "transaction date": "timestamp",
        
        "transaction amount": "amount",
        "spending":           "amount",
        "amount spent":       "amount",
        "nett spent":         "amount",
        
        "tenant name":     "tenant_name",
        "tenant":          "tenant_name",
        "outlet name":     "tenant_name",
        "entity name":     "tenant_name",
        
        "member tier":     "member_tier",
        "tier":            "member_tier",
        
        "category":        "category",
        "outlet category": "category",
        
        "gender":          "gender",
        "payment method":  "payment_method",
        "payment_method":  "payment_method",
    }
    
    new_cols = []
    for c in df.columns:
        if c in mapping:
            new_cols.append(mapping[c])
        else:
            new_cols.append(c.replace(" ", "_"))
            
    df.columns = new_cols
    return df



def validate_dataframe(df: pd.DataFrame) -> List[str]:
    """Validate required columns and data types. Returns list of error messages."""
    errors = []
    missing = REQUIRED_COLUMNS - set(df.columns)
    if missing:
        errors.append(f"Missing required columns: {', '.join(missing)}")
        return errors  # Can't proceed without required columns

    # Validate amount is numeric
    non_numeric = df[pd.to_numeric(df["amount"], errors="coerce").isna()]["amount"]
    if not non_numeric.empty:
        errors.append(f"{len(non_numeric)} rows have non-numeric 'amount' values.")

    # Validate timestamps
    try:
        pd.to_datetime(df["timestamp"])
    except Exception as e:
        errors.append(f"Invalid 'timestamp' format: {e}")

    return errors


async def ingest_file(
    db: AsyncSession,
    file: UploadFile,
    mall_id: str,
) -> dict:
    """
    Parse CSV or Excel upload and insert transactions into the database.
    Returns ingestion statistics.
    """
    content = await file.read()
    filename = file.filename or ""

    # Parse file
    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(content))
        elif filename.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(content))
        else:
            return {
                "success":        False,
                "rows_processed": 0,
                "rows_inserted":  0,
                "rows_failed":    0,
                "errors":         ["Unsupported file format. Use .csv or .xlsx"],
                "message":        "Upload failed.",
            }
    except Exception as e:
        return {
            "success":        False,
            "rows_processed": 0,
            "rows_inserted":  0,
            "rows_failed":    0,
            "errors":         [f"File parsing error: {str(e)}"],
            "message":        "Upload failed.",
        }

    df = normalize_columns(df)
    errors = validate_dataframe(df)
    if errors:
        return {
            "success":        False,
            "rows_processed": len(df),
            "rows_inserted":  0,
            "rows_failed":    len(df),
            "errors":         errors,
            "message":        "Validation failed.",
        }

    # Fill optional columns
    for col, default in OPTIONAL_DEFAULTS.items():
        if col not in df.columns:
            df[col] = default
    if "mall_id" not in df.columns:
        df["mall_id"] = mall_id

    # Coerce types
    df["amount"]     = pd.to_numeric(df["amount"], errors="coerce")
    df["timestamp"]  = pd.to_datetime(df["timestamp"], utc=True)
    df["mall_id"]    = mall_id
    df = df.dropna(subset=["amount", "timestamp"])

    rows_failed = 0
    rows_inserted = 0
    row_errors: List[str] = []

    # Resolve or auto-create tenant_ids
    for _, row in df.iterrows():
        try:
            # Upsert tenant
            tenant_result = await db.execute(
                text("""
                    INSERT INTO tenants (mall_id, tenant_name, category)
                    VALUES (:mall_id, :tenant_name, :category)
                    ON CONFLICT (mall_id, tenant_name) DO NOTHING
                    RETURNING tenant_id
                """),
                {
                    "mall_id":     mall_id,
                    "tenant_name": str(row["tenant_name"]).strip(),
                    "category":    str(row["category"]).strip(),
                },
            )
            tenant_row = tenant_result.fetchone()

            # If conflict (tenant already exists), fetch id
            if tenant_row is None:
                existing = await db.execute(
                    text("SELECT tenant_id FROM tenants WHERE mall_id = :m AND tenant_name = :n"),
                    {"m": mall_id, "n": str(row["tenant_name"]).strip()},
                )
                tenant_id = str(existing.scalar_one())
            else:
                tenant_id = str(tenant_row[0])

            await db.execute(
                text("""
                    INSERT INTO transactions
                        (transaction_id, timestamp, tenant_id, tenant_name, category,
                         amount, member_tier, gender, payment_method, mall_id)
                    VALUES
                        (:txn_id, :ts, :tenant_id, :tenant_name, :category,
                         :amount, :member_tier, :gender, :payment_method, :mall_id)
                """),

                {
                    "txn_id":         str(uuid.uuid4()),
                    "ts":             row["timestamp"].to_pydatetime(),
                    "tenant_id":      tenant_id,
                    "tenant_name":    str(row["tenant_name"]).strip(),
                    "category":       str(row["category"]).strip(),
                    "amount":         float(row["amount"]),
                    "member_tier":    str(row.get("member_tier", "Non-Member") or "Non-Member").strip(),
                    "gender":         str(row["gender"]).strip() if pd.notna(row.get("gender")) else None,
                    "payment_method": str(row["payment_method"]) if pd.notna(row.get("payment_method")) else None,
                    "mall_id":        mall_id,

                },
            )
            rows_inserted += 1

        except Exception as e:
            await db.rollback()
            rows_failed += 1
            row_errors.append(f"Row {_ + 2}: {str(e)}")
            continue

    await db.commit()

    return {
        "success":        rows_failed == 0,
        "rows_processed": len(df),
        "rows_inserted":  rows_inserted,
        "rows_failed":    rows_failed,
        "errors":         row_errors[:20],  # cap error list at 20
        "message":        f"Successfully inserted {rows_inserted} of {len(df)} rows.",
    }

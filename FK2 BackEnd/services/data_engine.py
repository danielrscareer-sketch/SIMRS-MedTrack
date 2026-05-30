import pandas as pd
from datetime import datetime, timezone
import os
import logging
from io import BytesIO
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, insert
from models.transaction import Transaction
from app.core.config import settings

logger = logging.getLogger(__name__)

class DataEngine:
    _instance = None
    _datasets = {
        "transaction": None,
        "social": None,
        "campaign": None
    }
    _df = None # Legacy reference

    @classmethod
    async def ingest_data(cls, db: AsyncSession, file_content: bytes, filename: str, dataset_type: str = "transaction", column_mapping: dict = None) -> dict:
        """
        Processes uploaded data and PERSISTS it into PostgreSQL.
        """
        try:
            if filename.endswith(".csv"):
                df_new = pd.read_csv(BytesIO(file_content))
            else:
                df_new = pd.read_excel(BytesIO(file_content))
            
            raw_new_count = len(df_new)
            
            # Default backend mappings
            if not column_mapping:
                if dataset_type == "transaction":
                    column_mapping = {
                        "Trans Date": "timestamp", "Outlet Name": "tenant_name",
                        "Outlet Category": "category", "Amount Spent": "amount",
                        "Gender": "gender", "Tier": "member_tier",
                        "Void By": "void_status", "Outlet Code": "tenant_id"
                    }
                elif dataset_type == "social":
                    column_mapping = {
                        "Post_ID": "post_id", "Platform": "platform", "Date": "timestamp", 
                        "Content_Type": "content_type", "Reach": "reach", 
                        "Impressions": "impressions", "Likes": "likes", "Comments": "comments",
                        "Shares": "shares", "Saves": "saves", "Clicks": "clicks", "Campaign_ID": "campaign_id"
                    }

            # Filter out invalid mapping keys
            usable_mapping = {k: v for k, v in column_mapping.items() if k in df_new.columns}
            df = df_new[list(usable_mapping.keys())].rename(columns=usable_mapping).copy()

            # --- Persistent Storage Logic ---
            mall_id = settings.DEFAULT_MALL_ID
            rows_inserted = 0

            if dataset_type == "transaction":
                # Clean Data
                df['timestamp'] = pd.to_datetime(df['timestamp'], dayfirst=True, errors='coerce')
                if df['timestamp'].dt.tz is None:
                    df['timestamp'] = df['timestamp'].dt.tz_localize('UTC')
                df['amount'] = pd.to_numeric(df['amount'], errors='coerce').fillna(0.0)
                
                # Filter out void and test
                df = df[df['amount'] > 0]
                
                # Bulk insert into PostgreSQL
                for _, row in df.iterrows():
                    if pd.isna(row['timestamp']): continue
                    
                    # Check for duplicates or use ON CONFLICT (if we had a unique constraint on timestamp+amount+tenant)
                    # For simplicity in this SaaS version, we append. 
                    # In production, use a more robust upsert.
                    stmt = text("""
                        INSERT INTO transactions (timestamp, tenant_name, category, amount, member_tier, gender, mall_id)
                        VALUES (:ts, :tn, :cat, :amt, :tier, :gen, :mid)
                        ON CONFLICT DO NOTHING
                    """)
                    await db.execute(stmt, {
                        "ts": row['timestamp'],
                        "tn": str(row.get('tenant_name', 'Unknown')),
                        "cat": str(row.get('category', 'Others')),
                        "amt": float(row.get('amount', 0)),
                        "tier": str(row.get('member_tier', 'Non-Member')),
                        "gen": str(row.get('gender', 'Unknown')),
                        "mid": mall_id
                    })
                    rows_inserted += 1
                
            elif dataset_type == "social":
                df['timestamp'] = pd.to_datetime(df.get('timestamp'), errors='coerce')
                if df['timestamp'].dt.tz is None:
                    df['timestamp'] = df['timestamp'].dt.tz_localize('UTC')
                
                for _, row in df.iterrows():
                    if pd.isna(row['timestamp']): continue
                    stmt = text("""
                        INSERT INTO social_metrics 
                        (mall_id, platform, post_id, timestamp, content_type, reach, impressions, likes, comments, shares, saves, clicks, campaign_id)
                        VALUES (:mid, :plat, :pid, :ts, :ct, :r, :imp, :l, :c, :sh, :sv, :clk, :cid)
                        ON CONFLICT DO NOTHING
                    """)
                    await db.execute(stmt, {
                        "mid": mall_id,
                        "plat": str(row.get('platform', 'Instagram')),
                        "pid": str(row.get('post_id', '')),
                        "ts": row['timestamp'],
                        "ct": str(row.get('content_type', 'Image')),
                        "r": int(row.get('reach', 0)),
                        "imp": int(row.get('impressions', 0)),
                        "l": int(row.get('likes', 0)),
                        "c": int(row.get('comments', 0)),
                        "sh": int(row.get('shares', 0)),
                        "sv": int(row.get('saves', 0)),
                        "clk": int(row.get('clicks', 0)),
                        "cid": str(row.get('campaign_id', ''))
                    })
                    rows_inserted += 1

            await db.commit()
            logger.info(f"Persistent Ingestion ({dataset_type}): {rows_inserted} rows saved to DB.")
            
            return {
                "success": True,
                "dataset_type": dataset_type,
                "rows_processed": raw_new_count,
                "new_rows_detected": rows_inserted,
                "total_records": rows_inserted # Simplified for now
            }
            
        except Exception as e:
            logger.error(f"Ingestion Error: {str(e)}")
            return {"success": False, "error": str(e)}

    @classmethod
    def get_df(cls, dataset_type: str = "transaction") -> pd.DataFrame:
        # Legacy support - theoretically we should query DB here too
        return pd.DataFrame()

import pandas as pd
import uuid
import os
import sys
from datetime import datetime
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Menambahkan path project agar bisa import config
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.core.config import settings

def migrate_excel_to_postgres():
    print("Starting data migration from Excel to PostgreSQL...", flush=True)
    
    # Konversi DATABASE_URL asyncpg ke psycopg v3 untuk script sync ini
    sync_url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql+psycopg://").split("?")[0]
    
    engine = create_engine(
        sync_url,
        connect_args={"prepare_threshold": 0}
    )
    Session = sessionmaker(bind=engine)
    session = Session()

    file_path = os.path.join(os.path.dirname(__file__), "..", "..", "Data_Master2026.xlsx")
    
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return

    print(f"Reading Excel file (this may take a few minutes)...", flush=True)
    df_raw = pd.read_excel(file_path)
    print(f"Successfully read {len(df_raw)} rows.", flush=True)

    # 1. Pastikan Mall Default ada
    mall_id = settings.DEFAULT_MALL_ID
    mall_name = settings.DEFAULT_MALL_NAME
    
    session.execute(text("""
        INSERT INTO malls (mall_id, name, city, address, is_active)
        VALUES (:id, :name, 'Bandung', 'Jl. Pasir Kaliki No.23', True)
        ON CONFLICT (mall_id) DO NOTHING
    """), {"id": mall_id, "name": mall_name})
    session.commit()
    print(f"Mall '{mall_name}' ready.")

    # 2. Proses Tenants
    print("Processing Tenant data...", flush=True)
    tenant_mapping = {
        "Outlet Name": "tenant_name",
        "Outlet Category": "category",
        "Outlet Code": "tenant_id"
    }
    
    # Ambil kolom yang ada
    usable_tenant_cols = [col for col in tenant_mapping.keys() if col in df_raw.columns]
    tenants_df = df_raw[usable_tenant_cols].drop_duplicates(subset=["Outlet Name"])
    
    tenant_count = 0
    for _, row in tenants_df.iterrows():
        t_name = str(row["Outlet Name"])
        t_cat = str(row.get("Outlet Category", "Others"))
        
        # Cek apakah tenant sudah ada
        result = session.execute(text("SELECT tenant_id FROM tenants WHERE tenant_name = :name AND mall_id = :mid"), 
                                {"name": t_name, "mid": mall_id}).fetchone()
        
        if not result:
            new_id = str(uuid.uuid4())
            session.execute(text("""
                INSERT INTO tenants (tenant_id, mall_id, tenant_name, category, is_active)
                VALUES (:tid, :mid, :name, :cat, True)
            """), {"tid": new_id, "mid": mall_id, "name": t_name, "cat": t_cat})
            tenant_count += 1

    session.commit()
    print(f"Successfully added {tenant_count} new tenants.")

    # 3. Proses Transaksi
    print("Processing Transaction data...", flush=True)
    
    # Bersihkan data transaksi lama agar tidak double jika script dijalankan ulang
    session.execute(text("TRUNCATE TABLE transactions CASCADE"))
    session.commit()
    
    # Ambil map tenant_name -> tenant_id untuk relasi
    tenant_lookup = {row[0]: row[1] for row in session.execute(text("SELECT tenant_name, tenant_id FROM tenants")).fetchall()}

    # Mapping kolom transaksi
    mapping = {
        "Trans Date": "timestamp",
        "Outlet Name": "tenant_name",
        "Outlet Category": "category",
        "Amount Spent": "amount",
        "Gender": "gender",
        "Tier": "member_tier",
        "Void By": "void_status"
    }
    
    usable_mapping = {k: v for k, v in mapping.items() if k in df_raw.columns}
    df = df_raw[list(usable_mapping.keys())].rename(columns=usable_mapping).copy()

    # Cleaning
    df['timestamp'] = pd.to_datetime(df['timestamp'], dayfirst=True, errors='coerce')
    df['amount'] = pd.to_numeric(df['amount'], errors='coerce').fillna(0.0)
    
    # Filter void & dummy
    if 'void_status' in df.columns:
        df = df[df['void_status'].isna()]
    df = df[~df['tenant_name'].str.contains("test|dummy|internal", case=False, na=False)]
    
    # Batasi batch untuk performa
    batch_size = 5000
    total_tx = len(df)
    processed = 0
    
    print(f"Inserting {total_tx} transactions in batches of {batch_size}...")
    
    for i in range(0, total_tx, batch_size):
        batch = df.iloc[i:i+batch_size]
        tx_data = []
        for _, row in batch.iterrows():
            t_id = tenant_lookup.get(row['tenant_name'])
            
            tx_data.append({
                "txid": str(uuid.uuid4()),
                "time": row['timestamp'],
                "tid": t_id,
                "tname": row['tenant_name'],
                "cat": row['category'],
                "amt": row['amount'],
                "tier": row.get('member_tier', 'Non-Member'),
                "gen": row.get('gender', 'Unknown'),
                "mid": mall_id
            })
        
        session.execute(text("""
            INSERT INTO transactions (transaction_id, timestamp, tenant_id, tenant_name, category, amount, member_tier, gender, mall_id)
            VALUES (:txid, :time, :tid, :tname, :cat, :amt, :tier, :gen, :mid)
        """), tx_data)
        
        session.commit()
        processed += len(batch)
        print(f"Progress: {processed}/{total_tx} ({(processed/total_tx)*100:.1f}%)", flush=True)

    print("\nMigration Complete!", flush=True)
    session.close()

if __name__ == "__main__":
    migrate_excel_to_postgres()

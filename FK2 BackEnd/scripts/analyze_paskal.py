import pandas as pd
import json
import warnings
import numpy as np
warnings.filterwarnings('ignore')

import os
from pathlib import Path

# Use relative path to data folder
BASE_DIR = Path(__file__).resolve().parent.parent
data_file = BASE_DIR / "data" / "Members Transactions16042026_.xlsx"

if not data_file.exists():
    # Fallback to absolute if needed, but relative is better
    data_file = Path(r'D:\Project Analisis\backend\data\Members Transactions16042026_.xlsx')

df = pd.read_excel(data_file, engine='openpyxl')

# Clean columns
df['Trans Date'] = pd.to_datetime(df['Trans Date'], dayfirst=True, errors='coerce')
df['Amount Spent'] = pd.to_numeric(df['Amount Spent'], errors='coerce').fillna(0)
df['Nett Spent']   = pd.to_numeric(df['Nett Spent'],   errors='coerce').fillna(0)
df['Age']          = pd.to_numeric(df['Age'],           errors='coerce').fillna(0)
df['Gender']       = df['Gender'].fillna('Unknown').str.strip()
df['Tier']         = df['Tier'].fillna('Unknown').str.strip()
df['Outlet Category'] = df['Outlet Category'].fillna('Other').str.strip()
df['Outlet Name']  = df['Outlet Name'].fillna('Unknown').str.strip()
df['POS ID']       = df['POS ID'].fillna('Unknown').str.strip()

# Remove extreme outliers (single txn > 1 Billion is suspect)
df_clean = df[(df['Nett Spent'] > 0) & (df['Nett Spent'] < 1_000_000_000)].copy()
removed = len(df) - len(df_clean)
print(f"Rows after filter: {len(df_clean)} (removed {removed} outliers)")
print(f"Date range: {df_clean['Trans Date'].min()} to {df_clean['Trans Date'].max()}")

# ── KPIs ──────────────────────────────────────────────────────────────────────
total_revenue = df_clean['Nett Spent'].sum()
avg_txn       = df_clean['Nett Spent'].mean()
total_txn     = len(df_clean)
unique_members= df_clean['MemberID'].nunique()

print("\n=== KPIs ===")
print(f"Total Revenue : Rp {total_revenue:,.0f}")
print(f"Avg Txn:        Rp {avg_txn:,.0f}")
print(f"Total Txn:      {total_txn:,}")
print(f"Unique Members: {unique_members:,}")

# ── Tier ──────────────────────────────────────────────────────────────────────
print("\n=== TIER ===")
tier = (df_clean.groupby('Tier')
        .agg(count=('MemberID','count'), revenue=('Nett Spent','sum'), avg=('Nett Spent','mean'))
        .sort_values('revenue', ascending=False).reset_index())
print(tier.to_string())

# ── Gender ────────────────────────────────────────────────────────────────────
print("\n=== GENDER ===")
gen = (df_clean.groupby('Gender')
       .agg(count=('MemberID','count'), revenue=('Nett Spent','sum'))
       .sort_values('revenue', ascending=False).reset_index())
print(gen.to_string())

# ── Age buckets ───────────────────────────────────────────────────────────────
print("\n=== AGE BUCKETS ===")
df_clean['age_group'] = pd.cut(df_clean['Age'],
    bins=[0,17,25,35,45,55,65,100],
    labels=['<18','18-25','26-35','36-45','46-55','56-65','65+'])
age = (df_clean.groupby('age_group', observed=True)
       .agg(count=('MemberID','count'), revenue=('Nett Spent','sum'), avg=('Nett Spent','mean'))
       .reset_index())
print(age.to_string())

# ── Outlet Category ───────────────────────────────────────────────────────────
print("\n=== OUTLET CATEGORY ===")
cat = (df_clean.groupby('Outlet Category')
       .agg(count=('MemberID','count'), revenue=('Nett Spent','sum'), avg=('Nett Spent','mean'))
       .sort_values('revenue', ascending=False).reset_index())
print(cat.to_string())

# ── Top 15 Tenants ────────────────────────────────────────────────────────────
print("\n=== TOP 15 TENANTS ===")
ten = (df_clean.groupby('Outlet Name')
       .agg(count=('MemberID','count'), revenue=('Nett Spent','sum'), avg=('Nett Spent','mean'))
       .sort_values('revenue', ascending=False).head(15).reset_index())
print(ten.to_string())

# ── POS / Source channel ──────────────────────────────────────────────────────
print("\n=== POS CHANNEL ===")
pos = (df_clean.groupby('POS ID')
       .agg(count=('MemberID','count'), revenue=('Nett Spent','sum'))
       .sort_values('revenue', ascending=False).head(10).reset_index())
print(pos.to_string())

# ── Daily trend (last 30 days) ────────────────────────────────────────────────
print("\n=== DAILY TREND (last 30 days) ===")
recent = df_clean[df_clean['Trans Date'] >= df_clean['Trans Date'].max() - pd.Timedelta(days=30)].copy()
daily = (recent.groupby(recent['Trans Date'].dt.date)
         .agg(count=('MemberID','count'), revenue=('Nett Spent','sum'))
         .reset_index())
daily.columns = ['date','count','revenue']
print(daily.to_string())

# ── Spending histogram buckets ────────────────────────────────────────────────
print("\n=== SPENDING HISTOGRAM ===")
bins = [0, 50_000, 100_000, 250_000, 500_000, 1_000_000, 10_000_000]
labels = ['<50K','50K-100K','100K-250K','250K-500K','500K-1Jt','>1Jt']
df_clean['spend_bucket'] = pd.cut(df_clean['Nett Spent'], bins=bins, labels=labels)
hist = (df_clean.groupby('spend_bucket', observed=True)
        .agg(count=('MemberID','count'), avg=('Nett Spent','mean'))
        .reset_index())
total_h = hist['count'].sum()
hist['pct'] = hist['count'] / total_h * 100
print(hist.to_string())

# ── Peak hour ─────────────────────────────────────────────────────────────────
print("\n=== PEAK HOUR ===")
df_clean['hour'] = pd.to_datetime(df_clean['Trans Time'], errors='coerce').dt.hour
hour_dist = (df_clean.groupby('hour')
             .agg(count=('MemberID','count'), revenue=('Nett Spent','sum'))
             .reset_index())
print(hour_dist.to_string())

# ── Weekly summary (for period filter) ───────────────────────────────────────
print("\n=== WEEKLY SUMMARY ===")
df_clean['week'] = df_clean['Trans Date'].dt.isocalendar().week
df_clean['year_week'] = df_clean['Trans Date'].dt.strftime('%Y-W%V')
weekly = (df_clean.groupby('year_week')
          .agg(count=('MemberID','count'), revenue=('Nett Spent','sum'), avg=('Nett Spent','mean'))
          .reset_index().sort_values('year_week'))
print(weekly.to_string())

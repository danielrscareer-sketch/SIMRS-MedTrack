"""
Generates real-data JSON files for 23 Paskal SaaS dashboard.
Outputs to paskal-dashboard/public/data/*.json
"""
import pandas as pd
import json
import warnings
import numpy as np
from pathlib import Path
warnings.filterwarnings('ignore')

BASE_DIR = Path(__file__).resolve().parent.parent.parent
OUT = BASE_DIR / "frontend" / "public" / "data"
OUT.mkdir(parents=True, exist_ok=True)

print("Loading Excel...")
data_file = BASE_DIR / "backend" / "data" / "Members Transactions16042026_.xlsx"
df = pd.read_excel(data_file, engine='openpyxl')

# ── Clean ──────────────────────────────────────────────────────────────────────
df['Trans Date']      = pd.to_datetime(df['Trans Date'],   dayfirst=True, errors='coerce')
df['Nett Spent']      = pd.to_numeric(df['Nett Spent'],    errors='coerce').fillna(0)
df['Age']             = pd.to_numeric(df['Age'],            errors='coerce').fillna(0)
df['Gender']          = df['Gender'].fillna('Unknown').str.strip()
df['Tier']            = df['Tier'].fillna('Unknown').str.strip()
df['Outlet Category'] = df['Outlet Category'].fillna('Other').str.strip()
df['Outlet Name']     = df['Outlet Name'].fillna('Unknown').str.strip()
df['MemberID']        = df['MemberID'].astype(str)

df_clean = df[(df['Nett Spent'] > 0) & (df['Nett Spent'] < 1_000_000_000)].copy()
print(f"Clean rows: {len(df_clean)}")

# ── 1. KPIs (by period) ────────────────────────────────────────────────────────
max_date = df_clean['Trans Date'].max()

def kpi_for_period(days):
    cur = df_clean[df_clean['Trans Date'] >= max_date - pd.Timedelta(days=days)]
    prv = df_clean[
        (df_clean['Trans Date'] >= max_date - pd.Timedelta(days=days*2)) &
        (df_clean['Trans Date'] <  max_date - pd.Timedelta(days=days))
    ]
    def growth(c, p):
        return round((c - p) / p * 100, 1) if p > 0 else 0.0
    cur_rev  = cur['Nett Spent'].sum()
    prv_rev  = prv['Nett Spent'].sum()
    cur_avg  = cur['Nett Spent'].mean() if len(cur) else 0
    prv_avg  = prv['Nett Spent'].mean() if len(prv) else 0
    cur_mem  = cur['MemberID'].nunique()
    prv_mem  = prv['MemberID'].nunique()
    def fmtIDR(v):
        if v >= 1e9: return f"Rp {v/1e9:.2f}B"
        if v >= 1e6: return f"Rp {v/1e6:.0f}Jt"
        return f"Rp {v/1e3:.0f}K"
    return {
        "total_revenue":    {"formatted_value": fmtIDR(cur_rev), "growth_pct": growth(cur_rev, prv_rev)},
        "avg_transaction":  {"formatted_value": fmtIDR(cur_avg), "growth_pct": growth(cur_avg, prv_avg)},
        "new_members":      {"formatted_value": f"{cur_mem:,}",  "growth_pct": growth(cur_mem, prv_mem)},
        "total_transactions": {"formatted_value": f"{len(cur):,}","growth_pct": growth(len(cur), len(prv))},
    }

kpis = {
    "weekly":   kpi_for_period(7),
    "biweekly": kpi_for_period(14),
    "monthly":  kpi_for_period(30),
    "yearly":   kpi_for_period(365),
}
(OUT / 'kpis.json').write_text(json.dumps(kpis, ensure_ascii=False), encoding='utf-8')
print("kpis.json written")

# ── 2. Top Tenants (top 10) ───────────────────────────────────────────────────
def top_tenants_for_period(days):
    cur = df_clean[df_clean['Trans Date'] >= max_date - pd.Timedelta(days=days)]
    prv = df_clean[
        (df_clean['Trans Date'] >= max_date - pd.Timedelta(days=days*2)) &
        (df_clean['Trans Date'] <  max_date - pd.Timedelta(days=days))
    ]
    cur_t = cur.groupby('Outlet Name').agg(
        revenue=('Nett Spent','sum'), count=('MemberID','count'), avg=('Nett Spent','mean')
    ).reset_index()
    prv_t = prv.groupby('Outlet Name').agg(rev_prev=('Nett Spent','sum')).reset_index()
    merged = cur_t.merge(prv_t, on='Outlet Name', how='left').fillna({'rev_prev': 0})
    merged['growth_pct'] = merged.apply(
        lambda r: round((r['revenue'] - r['rev_prev']) / r['rev_prev'] * 100, 1)
        if r['rev_prev'] > 0 else 0.0, axis=1
    )
    top = merged.sort_values('revenue', ascending=False).head(10).reset_index(drop=True)
    result = []
    for i, row in top.iterrows():
        # Get category of this tenant
        cat = df_clean[df_clean['Outlet Name'] == row['Outlet Name']]['Outlet Category'].mode()
        result.append({
            "rank": i + 1,
            "tenant_name":      row['Outlet Name'],
            "category":         cat.iloc[0] if len(cat) else "Other",
            "total_revenue":    int(row['revenue']),
            "transaction_count": int(row['count']),
            "avg_transaction":  int(row['avg']),
            "growth_pct":       float(row['growth_pct']),
        })
    return result

top_tenants = {p: top_tenants_for_period(d) for p, d in [("weekly",7),("biweekly",14),("monthly",30),("yearly",365)]}
(OUT / 'top_tenants.json').write_text(json.dumps(top_tenants, ensure_ascii=False), encoding='utf-8')
print("top_tenants.json written")

# ── 3. Category Contribution ──────────────────────────────────────────────────
def cat_contribution(days):
    cur = df_clean[df_clean['Trans Date'] >= max_date - pd.Timedelta(days=days)]
    prv = df_clean[
        (df_clean['Trans Date'] >= max_date - pd.Timedelta(days=days*2)) &
        (df_clean['Trans Date'] <  max_date - pd.Timedelta(days=days))
    ]
    c  = cur.groupby('Outlet Category').agg(revenue=('Nett Spent','sum'), count=('MemberID','count')).reset_index()
    p  = prv.groupby('Outlet Category').agg(rev_prev=('Nett Spent','sum')).reset_index()
    m = c.merge(p, on='Outlet Category', how='left').fillna({'rev_prev': 0})
    total_rev = m['revenue'].sum()
    m['contribution_pct'] = (m['revenue'] / total_rev * 100).round(1)
    m['growth_pct'] = m.apply(
        lambda r: round((r['revenue'] - r['rev_prev']) / r['rev_prev'] * 100, 1) if r['rev_prev'] > 0 else 0.0, axis=1
    )
    return m.sort_values('revenue', ascending=False).rename(columns={'Outlet Category':'category','count':'transaction_count'}).to_dict(orient='records')

cat_all = {p: cat_contribution(d) for p, d in [("weekly",7),("biweekly",14),("monthly",30),("yearly",365)]}
(OUT / 'category_contribution.json').write_text(json.dumps(cat_all, ensure_ascii=False), encoding='utf-8')
print("category_contribution.json written")

# ── 4. Gender + Tier breakdown ────────────────────────────────────────────────
gen = df_clean.groupby('Gender').agg(
    count=('MemberID','count'), revenue=('Nett Spent','sum'), avg=('Nett Spent','mean')
).reset_index()
(OUT / 'gender.json').write_text(json.dumps(gen.to_dict(orient='records'), ensure_ascii=False), encoding='utf-8')

tier = df_clean.groupby('Tier').agg(
    count=('MemberID','count'), revenue=('Nett Spent','sum'), avg=('Nett Spent','mean')
).reset_index()
(OUT / 'tier.json').write_text(json.dumps(tier.to_dict(orient='records'), ensure_ascii=False), encoding='utf-8')
print("gender.json + tier.json written")

# ── 5. Daily revenue trend (full dataset) ─────────────────────────────────────
daily = df_clean.groupby(df_clean['Trans Date'].dt.date).agg(
    count=('MemberID','count'), revenue=('Nett Spent','sum')
).reset_index()
daily['Trans Date'] = daily['Trans Date'].astype(str)
daily.columns = ['date','count','revenue']
(OUT / 'daily_trend.json').write_text(json.dumps(daily.to_dict(orient='records'), ensure_ascii=False), encoding='utf-8')
print("daily_trend.json written")

# ── 6. Weekly trend for 3-line chart ─────────────────────────────────────────
df_clean['year_week'] = df_clean['Trans Date'].dt.strftime('%Y-W%V')
# Split by membership status: Platinum+Gold vs Silver+Basic
high_tier = ['Platinum', 'Gold']
df_clean['tier_group'] = df_clean['Tier'].apply(lambda x: 'premium' if x in high_tier else 'regular')
weekly_total   = df_clean.groupby('year_week')['Nett Spent'].sum()
weekly_premium = df_clean[df_clean['tier_group']=='premium'].groupby('year_week')['Nett Spent'].sum()
weekly_regular = df_clean[df_clean['tier_group']=='regular'].groupby('year_week')['Nett Spent'].sum()
weekly_df = pd.DataFrame({'total': weekly_total, 'premium': weekly_premium, 'regular': weekly_regular}).fillna(0).reset_index()
weekly_df.columns = ['date','total','premium','regular']
(OUT / 'weekly_trend.json').write_text(json.dumps(weekly_df.to_dict(orient='records'), ensure_ascii=False), encoding='utf-8')
print("weekly_trend.json written")

# ── 7. Spending histogram ─────────────────────────────────────────────────────
bins   = [0, 50_000, 100_000, 250_000, 500_000, 1_000_000, 10_000_000]
labels = ['<50K','50-100K','100-250K','250-500K','500K-1Jt','>1Jt']
tiers  = ['low','mid-low','mid','mid-high','high','premium']
df_clean['spend_bucket'] = pd.cut(df_clean['Nett Spent'], bins=bins, labels=labels)
hist = df_clean.groupby('spend_bucket', observed=True).agg(count=('MemberID','count'), avg=('Nett Spent','mean')).reset_index()
total_h = hist['count'].sum()
hist_out = []
for i, row in hist.iterrows():
    hist_out.append({
        "range": str(row['spend_bucket']),
        "count": int(row['count']),
        "percentage": round(float(row['count']) / float(total_h) * 100, 1),
        "avg_amount": int(row['avg']),
        "tier": tiers[i] if i < len(tiers) else 'other',
    })
(OUT / 'spending_histogram.json').write_text(json.dumps(hist_out, ensure_ascii=False), encoding='utf-8')
print("spending_histogram.json written")

# ── 8. Age distribution ───────────────────────────────────────────────────────
df_clean['age_group'] = pd.cut(df_clean['Age'],
    bins=[0,17,25,35,45,55,65,100],
    labels=['<18','18-25','26-35','36-45','46-55','56-65','65+'])
age_out = df_clean.groupby('age_group', observed=True).agg(
    count=('MemberID','count'), revenue=('Nett Spent','sum'), avg=('Nett Spent','mean')
).reset_index()
age_out['age_group'] = age_out['age_group'].astype(str)
(OUT / 'age_distribution.json').write_text(json.dumps(age_out.to_dict(orient='records'), ensure_ascii=False), encoding='utf-8')
print("age_distribution.json written")

# ── 9. Radar data (category impact scores) ────────────────────────────────────
# Normalize each metric 0-100 relative to max
cat_scores = df_clean.groupby('Outlet Category').agg(
    revenue=('Nett Spent','sum'),
    volume=('MemberID','count'),
    avg=('Nett Spent','mean'),
    members=('MemberID','nunique'),
).reset_index()
for col in ['revenue','volume','avg','members']:
    mx = cat_scores[col].max()
    cat_scores[col + '_score'] = (cat_scores[col] / mx * 100).round(1)

main_cats = ['FOOD','LIFESTYLE','JEWELRY','ELECTRONICS','LUXURY','TOYS','BEAUTY','SPORTS','FASHION','ENTERTAINMENT']
cat_scores = cat_scores[cat_scores['Outlet Category'].isin(main_cats)]
radar_metrics = ['Revenue','Volume','Avg Spend','Unique Members']
radar_out = []
for m, col in zip(radar_metrics, ['revenue_score','volume_score','avg_score','members_score']):
    row = {'metric': m}
    for _, r in cat_scores.iterrows():
        key = r['Outlet Category'].lower().replace(' ','_').replace('&','and')
        row[key] = float(r[col])
    radar_out.append(row)
(OUT / 'radar_data.json').write_text(json.dumps(radar_out, ensure_ascii=False), encoding='utf-8')
print("radar_data.json written")

# ── 10. Peak hour ─────────────────────────────────────────────────────────────
# Trans Time column has all 00:00:00 — use Trans Date for day-of-week instead
df_clean['dayofweek'] = df_clean['Trans Date'].dt.day_name()
dow = df_clean.groupby('dayofweek').agg(count=('MemberID','count'), revenue=('Nett Spent','sum')).reset_index()
(OUT / 'day_of_week.json').write_text(json.dumps(dow.to_dict(orient='records'), ensure_ascii=False), encoding='utf-8')
print("day_of_week.json written")

print("\nAll done! Files in:", OUT)

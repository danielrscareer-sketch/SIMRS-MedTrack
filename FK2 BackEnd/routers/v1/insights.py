"""
/api/v1/generate-insights — Executive Intelligence Report endpoint via SQL Database.
"""
from __future__ import annotations
import logging
from datetime import datetime, timezone, timedelta
from typing import Literal, Optional

from fastapi import APIRouter, Query, Header, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc, text
from models.database import get_db
from models.transaction import Transaction
from services.ai_insights import (
    InsightOutput,
    InsightRequest,
    MemberTierSnapshot,
    PeakHourItem,
    TenantSnapshotItem,
    generate_insights,
)
from services.analytics import calculate_growth, resolve_period_bounds
from services.cache import CacheManager
from app.core.config import settings

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1", tags=["AI Insights v1"])

PeriodLiteral = Literal["weekly", "biweekly", "monthly", "yearly"]

PERIOD_LABEL_MAP = {
    "weekly":   "Minggu Ini",
    "biweekly": "Dua Minggu Ini",
    "monthly":  "Bulan Ini",
    "yearly":   "Tahun Ini",
}

DAYS_ID = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]

async def get_insights_data(db: AsyncSession, period: str, mall_id: str, custom_start=None, custom_end=None, comp_start=None, comp_end=None):
    c_start, c_end, p_start, p_end = await resolve_period_bounds(db, period, custom_start, custom_end, comp_start, comp_end)
    
    # 1. Category Rev
    stmt_c = select(Transaction.category, func.sum(Transaction.amount).label("rev")).where(and_(Transaction.mall_id == mall_id, Transaction.timestamp >= c_start, Transaction.timestamp <= c_end)).group_by(Transaction.category)
    cat_cur = {row.category: float(row.rev) for row in (await db.execute(stmt_c)).fetchall()}
    
    stmt_p = select(Transaction.category, func.sum(Transaction.amount).label("rev")).where(and_(Transaction.mall_id == mall_id, Transaction.timestamp >= p_start, Transaction.timestamp <= p_end)).group_by(Transaction.category)
    cat_prv = {row.category: float(row.rev) for row in (await db.execute(stmt_p)).fetchall()}
    
    # 2. Tenants
    stmt_t = select(Transaction.tenant_name, Transaction.category, func.sum(Transaction.amount).label("rev"), func.count(Transaction.transaction_id).label("cnt")).where(and_(Transaction.mall_id == mall_id, Transaction.timestamp >= c_start, Transaction.timestamp <= c_end)).group_by(Transaction.tenant_name, Transaction.category).order_by(desc("rev"))
    t_stats = (await db.execute(stmt_t)).fetchall()
    
    stmt_tp = select(Transaction.tenant_name, func.sum(Transaction.amount).label("rev")).where(and_(Transaction.mall_id == mall_id, Transaction.timestamp >= p_start, Transaction.timestamp <= p_end)).group_by(Transaction.tenant_name)
    p_rev_map = {row.tenant_name: float(row.rev) for row in (await db.execute(stmt_tp)).fetchall()}
    
    items = []
    for r in t_stats:
        c_rev = float(r.rev)
        p_rev = float(p_rev_map.get(r.tenant_name, 0.0))
        items.append(TenantSnapshotItem(
            tenant_name=r.tenant_name,
            category=r.category,
            total_revenue=c_rev,
            transaction_count=int(r.cnt),
            growth_pct=calculate_growth(c_rev, p_rev)
        ))
    top5 = items[:5]
    bot5 = sorted(items, key=lambda x: x.total_revenue)[:5]
    
    # 3. Tiers
    stmt_tr = select(Transaction.member_tier, func.sum(Transaction.amount).label("rev"), func.count(Transaction.transaction_id).label("cnt")).where(and_(Transaction.mall_id == mall_id, Transaction.timestamp >= c_start, Transaction.timestamp <= c_end)).group_by(Transaction.member_tier)
    c_tiers = (await db.execute(stmt_tr)).fetchall()
    
    stmt_trp = select(Transaction.member_tier, func.sum(Transaction.amount).label("rev")).where(and_(Transaction.mall_id == mall_id, Transaction.timestamp >= p_start, Transaction.timestamp <= p_end)).group_by(Transaction.member_tier)
    p_tiers_map = {row.member_tier: float(row.rev) for row in (await db.execute(stmt_trp)).fetchall()}
    
    tiers = []
    for r in c_tiers:
        c_rev = float(r.rev)
        p_rev = float(p_tiers_map.get(r.member_tier, 0.0))
        tiers.append(MemberTierSnapshot(
            tier=r.member_tier, total_revenue=c_rev, transaction_count=int(r.cnt), growth_pct=calculate_growth(c_rev, p_rev)
        ))
        
    # 4. Peak Hours
    peaks = []
    stmt_ph = select(func.extract('hour', Transaction.timestamp).label("hr"), func.extract('dow', Transaction.timestamp).label("dow"), func.count(Transaction.transaction_id).label("cnt"), func.sum(Transaction.amount).label("rev")).where(and_(Transaction.mall_id == mall_id, Transaction.timestamp >= c_start, Transaction.timestamp <= c_end)).group_by("hr", "dow").order_by(desc("cnt")).limit(10)
    res_ph = (await db.execute(stmt_ph)).fetchall()
    for r in res_ph:
        peaks.append(PeakHourItem(
            hour=int(r.hr), day_of_week=DAYS_ID[int(r.dow)], transaction_count=int(r.cnt), total_revenue=float(r.rev), is_anomaly=False
        ))
    
    cur_total = sum(cat_cur.values())
    prv_total = sum(cat_prv.values())
    
    return {
        'cat_cur': cat_cur, 'cat_prv': cat_prv, 'top5': top5, 'bot5': bot5,
        'member_tiers': tiers, 'peak_hours': peaks, 'consecutive_dec': [],
        'cur_total': cur_total, 'prv_total': prv_total
    }

@router.get("/generate-insights",  response_model=InsightOutput)
@router.post("/generate-insights", response_model=InsightOutput)
async def generate_insights_endpoint(
    period:     PeriodLiteral = Query(default="weekly"),
    mall_id:    Optional[str]  = Query(default=None),
    from_date:  Optional[str]  = Query(default=None),
    to_date:    Optional[str]  = Query(default=None),
    comp_from_date: Optional[str] = Query(default=None),
    comp_to_date:   Optional[str] = Query(default=None),
    force_refresh: bool        = Query(default=False),
    x_cache_control: Optional[str] = Header(default=None),
    db: AsyncSession = Depends(get_db)
):
    mall = mall_id or settings.DEFAULT_MALL_ID
    no_cache = force_refresh or (x_cache_control or "").lower() == "no-cache"
    cache_payload = {"period": period, "mall_id": mall, "from": from_date, "to": to_date}
    cache_key = CacheManager.make_key(f"insight:{mall}", cache_payload)

    if not no_cache:
        cached = await CacheManager.get(cache_key)
        if cached:
            log.info("Cache HIT for %s", cache_key)
            result = InsightOutput(**cached)
            result.cached = True
            return result

    log.info("Cache MISS for %s — invoking AI engine", cache_key)
    
    ISO_FMT = "%Y-%m-%d"
    fr, to = None, None
    if from_date and to_date:
        try:
            fr = datetime.strptime(from_date, ISO_FMT).replace(tzinfo=timezone.utc)
            to = datetime.strptime(to_date, ISO_FMT).replace(hour=23, minute=59, second=59, tzinfo=timezone.utc)
        except ValueError:
            pass

    cfr, cto = None, None
    if comp_from_date and comp_to_date:
        try:
            cfr = datetime.strptime(comp_from_date, ISO_FMT).replace(tzinfo=timezone.utc)
            cto = datetime.strptime(comp_to_date, ISO_FMT).replace(hour=23, minute=59, second=59, tzinfo=timezone.utc)
        except ValueError:
            pass
            
    data = await get_insights_data(db, period, mall, custom_start=fr, custom_end=to, comp_start=cfr, comp_end=cto)

    req = InsightRequest(
        period            = period,
        period_label      = PERIOD_LABEL_MAP.get(period, period.title()),
        mall_name         = settings.DEFAULT_MALL_NAME,
        mall_id           = mall,
        current_amount    = data['cur_total'],
        previous_amount   = data['prv_total'],
        growth_pct        = calculate_growth(data['cur_total'], data['prv_total']),
        category_current  = data['cat_cur'],
        category_previous = data['cat_prv'],
        top_tenants       = data['top5'],
        bottom_tenants    = data['bot5'],
        consecutive_declining = data['consecutive_dec'],
        member_tier_data  = data['member_tiers'],
        peak_hours        = data['peak_hours'],
    )

    output = await generate_insights(req, settings)
    await CacheManager.set(cache_key, output.model_dump())
    output.cached = False
    return output

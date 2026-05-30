import asyncio
import sys
import uuid
import os
sys.path.append(r'd:\Project Analisis Backend\backend')
from app.core.config import settings
from models.database import AsyncSessionLocal
from services.analytics import get_member_trend, get_customer_growth, get_member_equity_kpis, get_tier_data

async def main():
    try:
        mall_id = settings.DEFAULT_MALL_ID
        async with AsyncSessionLocal() as db:
            print('Tiers:', await get_tier_data(db, 'monthly', mall_id))
            print('Trend:', await get_member_trend(db, 'monthly', mall_id))
            print('Growth:', await get_customer_growth(db, 'monthly', mall_id))
            print('KPIs:', await get_member_equity_kpis(db, 'monthly', mall_id))
    except Exception as e:
        import traceback
        traceback.print_exc()

asyncio.run(main())

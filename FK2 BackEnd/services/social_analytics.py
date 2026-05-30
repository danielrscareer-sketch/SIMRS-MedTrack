from sqlalchemy import select, func, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession
from models.database import get_db
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

class SocialAnalyticsEngine:
    @staticmethod
    async def get_aggregated_kpis(db: AsyncSession):
        # We need a social_metrics model, but let's use raw SQL or dynamic reflection if not defined
        # For now, let's assume we have a table 'social_metrics'
        from sqlalchemy import text
        res = await db.execute(text("SELECT SUM(reach), SUM(impressions), SUM(likes) + SUM(comments) + SUM(shares) FROM social_metrics"))
        row = res.fetchone()
        
        reach = int(row[0] or 0)
        impressions = int(row[1] or 0)
        engagements = int(row[2] or 0)
        er = round((engagements / reach * 100), 2) if reach > 0 else 0.0
        
        return {
            "total_reach": reach,
            "total_impressions": impressions,
            "total_engagements": engagements,
            "avg_engagement_rate": er,
            "top_platform": "Instagram" # Placeholder or query platform with max reach
        }

    @staticmethod
    async def get_growth_trend(db: AsyncSession, platform: str = None):
        from sqlalchemy import text
        query = "SELECT DATE_TRUNC('day', timestamp) as day, SUM(reach) as reach, SUM(impressions) as impressions FROM social_metrics"
        if platform:
            query += f" WHERE platform = '{platform}'"
        query += " GROUP BY day ORDER BY day"
        
        res = await db.execute(text(query))
        return [{"date": row.day.strftime('%Y-%m-%d'), "reach": int(row.reach or 0), "impressions": int(row.impressions or 0)} for row in res.fetchall()]

    @staticmethod
    async def get_top_content(db: AsyncSession, limit: int = 5):
        from sqlalchemy import text
        # Simple virality score in SQL
        query = f"""
            SELECT post_id, platform, content_type, reach, (likes + comments + shares) as engagements 
            FROM social_metrics 
            ORDER BY (likes + comments + shares) DESC 
            LIMIT {limit}
        """
        res = await db.execute(text(query))
        return [dict(row._mapping) for row in res.fetchall()]

import asyncio
import os
import sys

# Menambahkan path project
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from models.database import engine, Base
from models.transaction import Mall, Tenant, Transaction  # Import agar terdaftar di Base

async def init_db():
    print("Creating tables in database...")
    async with engine.begin() as conn:
        # Hapus komentar di bawah jika ingin mereset database (HATI-HATI!)
        # await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    print("Success! All tables created.")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(init_db())

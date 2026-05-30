import asyncio
import sys
import os
import re
from sqlalchemy import text
from models.database import engine, settings

async def migrate():
    schema_path = os.path.join(os.path.dirname(__file__), "schema.sql")
    with open(schema_path, "r") as f:
        content = f.read()

    # Remove comments
    content = re.sub(r'--.*', '', content)
    
    # Split by semicolon, but handle $$ blocks for functions
    statements = []
    current_stmt = []
    in_dollar = False
    
    is_sqlite = settings.DATABASE_URL.startswith("sqlite")

    for line in content.split('\n'):
        if '$$' in line:
            in_dollar = not in_dollar
        
        current_stmt.append(line)
        
        if ';' in line and not in_dollar:
            # End of statement
            full_stmt = '\n'.join(current_stmt).strip()
            if full_stmt:
                if is_sqlite:
                    # Skip postgres-only features
                    if "pgcrypto" in full_stmt.lower() or "update_updated_at_column" in full_stmt.lower():
                        current_stmt = []
                        continue
                    if "materialized view" in full_stmt.lower():
                        current_stmt = []
                        continue
                    if "create trigger" in full_stmt.lower():
                        current_stmt = []
                        continue
                    # Remove CASCADE only in DROP TABLE
                    full_stmt = re.sub(r'DROP TABLE IF EXISTS\s+(\w+)\s+CASCADE', r'DROP TABLE IF EXISTS \1', full_stmt, flags=re.IGNORECASE)
                    # Remove gen_random_uuid() default generator (handled by SQLAlchemy)
                    full_stmt = full_stmt.replace("DEFAULT gen_random_uuid()", "")
                    # Replace NOW() with CURRENT_TIMESTAMP for SQLite
                    full_stmt = full_stmt.replace("NOW()", "CURRENT_TIMESTAMP").replace("now()", "CURRENT_TIMESTAMP")


                
                statements.append(full_stmt)
            current_stmt = []

    print(f"Executing {len(statements)} statements on database (SQLite={is_sqlite})...")
    
    async with engine.connect() as conn:
        for stmt in statements:
            if not stmt: continue
            print(f"Running: {stmt[:60].replace('\n', ' ')}...")
            try:
                async with conn.begin():
                    await conn.execute(text(stmt))
            except Exception as e:
                if "already exists" in str(e).lower():
                    print("  -> Already exists.")
                    continue
                print(f"  -> Error: {e}")

    print("Migration finished.")

if __name__ == "__main__":
    asyncio.run(migrate())


import asyncio
import os
import sys
from typing import BinaryIO
from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.database import AsyncSessionLocal
from services.ingestion import ingest_file
from app.core.config import settings

class MockUploadFile:
    def __init__(self, file_path: str):
        self.filename = os.path.basename(file_path)
        self.file_path = file_path
        self._file = open(file_path, "rb")

    async def read(self):
        return self._file.read()

    async def close(self):
        self._file.close()

async def main():
    if len(sys.argv) < 2:
        print("Usage: python ingest_excel_cli.py <path_to_excel_file>")
        return

    excel_path = sys.argv[1]
    if not os.path.exists(excel_path):
        print(f"Error: File not found at {excel_path}")
        return

    print(f"🚀 Starting ingestion for: {excel_path}")
    
    mock_file = MockUploadFile(excel_path)
    
    async with AsyncSessionLocal() as session:
        try:
            result = await ingest_file(
                db=session,
                file=mock_file,
                mall_id=settings.DEFAULT_MALL_ID
            )
            
            if result["success"]:
                print(f"✅ Success: {result['message']}")
                print(f"   Rows Processed: {result['rows_processed']}")
                print(f"   Rows Inserted:  {result['rows_inserted']}")
            else:
                print(f"❌ Error: {result['message']}")
                for err in result.get("errors", []):
                    print(f"   - {err}")
                    
        except Exception as e:
            print(f"💥 Critical Error: {str(e)}")
        finally:
            await mock_file.close()

if __name__ == "__main__":
    asyncio.run(main())

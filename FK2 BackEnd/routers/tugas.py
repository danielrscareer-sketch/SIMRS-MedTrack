from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from models.database import get_db
from models.tugas import Tugas
from models.user import User
from models.schemas import TugasResponse, TugasSubmitRequest
from typing import List, Optional
from datetime import datetime
import uuid

router = APIRouter(prefix="/api/tugas", tags=["Assignments"])

async def get_user_by_username(db: AsyncSession, username: str) -> User:
    stmt = select(User).where(User.username == username)
    result = await db.execute(stmt)
    user = result.scalar()
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    return user

@router.get("/", response_model=List[TugasResponse])
async def list_student_tugas(username: str = Query(...), db: AsyncSession = Depends(get_db)):
    user = await get_user_by_username(db, username)
    
    stmt = select(Tugas).where(Tugas.student_id == user.user_id).order_by(Tugas.due_date.asc())
    result = await db.execute(stmt)
    tugas_list = result.scalars().all()
    
    response = []
    for t in tugas_list:
        response.append(
            TugasResponse(
                id=str(t.tugas_id),
                title=t.title,
                description=t.description or "",
                dueDate=t.due_date.strftime("%d %b %Y"),
                status=t.status,
                grade=t.grade or "-",
                score=t.score,
                comment=t.comment or "",
                submissionFile=t.submission_file or "",
                submittedAt=t.submitted_at.strftime("%d %b %Y, %H:%M WIB") if t.submitted_at else ""
            )
        )
        
    return response

@router.post("/submit/{tugas_id}", response_model=TugasResponse)
async def submit_tugas(
    tugas_id: uuid.UUID,
    payload: TugasSubmitRequest,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Tugas).where(Tugas.tugas_id == tugas_id)
    result = await db.execute(stmt)
    t = result.scalar()
    
    if not t:
        raise HTTPException(status_code=404, detail="Tugas tidak ditemukan")
        
    t.submission_file = payload.submissionFile
    t.status = "Menunggu Penilaian"
    t.submitted_at = datetime.now()
    
    await db.commit()
    await db.refresh(t)
    
    return TugasResponse(
        id=str(t.tugas_id),
        title=t.title,
        description=t.description or "",
        dueDate=t.due_date.strftime("%d %b %Y"),
        status=t.status,
        grade=t.grade or "-",
        score=t.score,
        comment=t.comment or "",
        submissionFile=t.submission_file or "",
        submittedAt=t.submitted_at.strftime("%d %b %Y, %H:%M WIB") if t.submitted_at else ""
    )

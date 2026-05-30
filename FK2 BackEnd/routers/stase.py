from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from models.database import get_db
from models.rotation import Rotation
from models.stase import Stase, CompetencyTarget, CompetencyProgress
from models.user import User
from models.schemas import ActiveStaseResponse, RotationResponse, CompetencyTargetResponse
from typing import List, Optional
import uuid

router = APIRouter(prefix="/api/stase", tags=["Stase Rotations"])

async def get_user_by_username(db: AsyncSession, username: str) -> User:
    stmt = select(User).where(User.username == username)
    result = await db.execute(stmt)
    user = result.scalar()
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    return user

@router.get("/current", response_model=ActiveStaseResponse)
async def get_current_stase(username: str = Query(...), db: AsyncSession = Depends(get_db)):
    user = await get_user_by_username(db, username)
    
    # Find active rotation (status 'Berjalan')
    stmt = select(Rotation).where(
        and_(Rotation.student_id == user.user_id, Rotation.status == "Berjalan")
    )
    result = await db.execute(stmt)
    active_rot = result.scalar()
    
    if not active_rot:
        return ActiveStaseResponse(current_stase=None, targets=[])
        
    # Map active rotation fields to response
    rot_resp = RotationResponse(
        rotation_id=active_rot.rotation_id,
        student_id=active_rot.student_id,
        stase_id=active_rot.stase_id,
        stase_name=active_rot.stase.name if active_rot.stase else "Unknown",
        duration_weeks=active_rot.stase.duration_weeks if active_rot.stase else 4,
        hospital=active_rot.hospital,
        supervisor_name=active_rot.supervisor.name if active_rot.supervisor else "Supervisor Utama",
        start_date=active_rot.start_date.strftime("%d %b %Y"),
        end_date=active_rot.end_date.strftime("%d %b %Y"),
        status=active_rot.status,
        grade=active_rot.grade or "-",
        night_shifts_done=active_rot.night_shifts_done,
        night_shifts_total=active_rot.night_shifts_total
    )
    
    # Get competency targets and progress for this active stase
    stmt_targets = select(CompetencyTarget).where(CompetencyTarget.stase_id == active_rot.stase_id)
    res_targets = await db.execute(stmt_targets)
    targets = res_targets.scalars().all()
    
    target_responses = []
    for tgt in targets:
        # Check progress
        stmt_prog = select(CompetencyProgress).where(
            and_(CompetencyProgress.student_id == user.user_id, CompetencyProgress.target_id == tgt.target_id)
        )
        res_prog = await db.execute(stmt_prog)
        prog = res_prog.scalar()
        achieved = prog.achieved_count if prog else 0
        
        target_responses.append(
            CompetencyTargetResponse(
                target_id=tgt.target_id,
                stase_id=tgt.stase_id,
                case_name=tgt.case_name,
                target_count=tgt.target_count,
                level=tgt.level,
                achieved_count=achieved
            )
        )
        
    return ActiveStaseResponse(current_stase=rot_resp, targets=target_responses)


@router.get("/history", response_model=List[RotationResponse])
async def get_stase_history(username: str = Query(...), db: AsyncSession = Depends(get_db)):
    user = await get_user_by_username(db, username)
    
    # Find all completed rotations (status 'Selesai')
    stmt = select(Rotation).where(
        and_(Rotation.student_id == user.user_id, Rotation.status == "Selesai")
    ).order_by(Rotation.end_date.desc())
    
    result = await db.execute(stmt)
    completed_rotations = result.scalars().all()
    
    response = []
    for rot in completed_rotations:
        response.append(
            RotationResponse(
                rotation_id=rot.rotation_id,
                student_id=rot.student_id,
                stase_id=rot.stase_id,
                stase_name=rot.stase.name if rot.stase else "Unknown",
                duration_weeks=rot.stase.duration_weeks if rot.stase else 4,
                hospital=rot.hospital,
                supervisor_name=rot.supervisor.name if rot.supervisor else "Supervisor Utama",
                start_date=rot.start_date.strftime("%d %b %Y"),
                end_date=rot.end_date.strftime("%d %b %Y"),
                status=rot.status,
                grade=rot.grade or "-",
                night_shifts_done=rot.night_shifts_done,
                night_shifts_total=rot.night_shifts_total
            )
        )
        
    return response

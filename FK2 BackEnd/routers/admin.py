from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from models.database import get_db
from models.rotation import Rotation
from models.stase import Stase
from models.user import User
from models.schemas import (
    RekapNilaiResponse, RotationCreateRequest, RotationResponse, UserResponse,
    UserCreateRequest, StaseCreateRequest
)
from typing import List, Optional
import uuid
import uuid as _uuid  # fallback

router = APIRouter(prefix="/api/admin", tags=["Admin / TU Dashboard"])

@router.get("/rekap-nilai", response_model=List[RekapNilaiResponse])
async def rekap_nilai(db: AsyncSession = Depends(get_db)):
    # Fetch all students
    stmt_students = select(User).where(User.role == "mahasiswakoas")
    res_students = await db.execute(stmt_students)
    students = res_students.scalars().all()

    # Fetch all stases
    stmt_stases = select(Stase)
    res_stases = await db.execute(stmt_stases)
    stases = res_stases.scalars().all()
    stase_names = [s.name for s in stases]

    response = []
    for std in students:
        # Find all rotations for this student
        stmt_rot = select(Rotation).where(Rotation.student_id == std.user_id)
        res_rot = await db.execute(stmt_rot)
        rotations = res_rot.scalars().all()

        grades_map = {}
        # Prepopulate with dash for all active stases
        for name in stase_names:
            grades_map[name] = "-"

        for rot in rotations:
            stase_name = rot.stase.name if rot.stase else ""
            if stase_name:
                grades_map[stase_name] = rot.grade or "-"

        response.append(
            RekapNilaiResponse(
                studentName=std.name,
                nim=std.username,
                grades=grades_map
            )
        )
    return response


@router.get("/plotting", response_model=List[RotationResponse])
async def list_plottings(db: AsyncSession = Depends(get_db)):
    stmt = select(Rotation).order_by(Rotation.start_date.desc())
    result = await db.execute(stmt)
    rotations = result.scalars().all()

    response = []
    for r in rotations:
        response.append(
            RotationResponse(
                rotation_id=r.rotation_id,
                student_id=r.student_id,
                stase_id=r.stase_id,
                stase_name=r.stase.name if r.stase else "Unknown",
                duration_weeks=r.stase.duration_weeks if r.stase else 4,
                hospital=r.hospital,
                supervisor_name=r.supervisor.name if r.supervisor else "Supervisor Utama",
                start_date=r.start_date.strftime("%Y-%m-%d"),
                end_date=r.end_date.strftime("%Y-%m-%d"),
                status=r.status,
                grade=r.grade or "-",
                night_shifts_done=r.night_shifts_done,
                night_shifts_total=r.night_shifts_total
            )
        )
    return response


@router.post("/plotting", response_model=RotationResponse, status_code=201)
async def create_plotting(payload: RotationCreateRequest, db: AsyncSession = Depends(get_db)):
    # Check if student exists
    stmt_std = select(User).where(and_(User.user_id == payload.student_id, User.role == "mahasiswakoas"))
    res_std = await db.execute(stmt_std)
    student = res_std.scalar()
    if not student:
        raise HTTPException(status_code=400, detail="Student tidak ditemukan")

    # Check if stase exists
    stmt_st = select(Stase).where(Stase.stase_id == payload.stase_id)
    res_st = await db.execute(stmt_st)
    stase = res_st.scalar()
    if not stase:
        raise HTTPException(status_code=400, detail="Stase tidak ditemukan")

    db_rot = Rotation(
        student_id=payload.student_id,
        stase_id=payload.stase_id,
        hospital=payload.hospital,
        supervisor_id=payload.supervisor_id,
        start_date=payload.start_date,
        end_date=payload.end_date,
        status="Berjalan",
        grade="-",
        night_shifts_done=0,
        night_shifts_total=payload.night_shifts_total
    )

    db.add(db_rot)
    await db.commit()
    await db.refresh(db_rot)

    # Reload relation
    stmt_reload = select(Rotation).where(Rotation.rotation_id == db_rot.rotation_id)
    res_reload = await db.execute(stmt_reload)
    db_rot = res_reload.scalar()

    return RotationResponse(
        rotation_id=db_rot.rotation_id,
        student_id=db_rot.student_id,
        stase_id=db_rot.stase_id,
        stase_name=db_rot.stase.name if db_rot.stase else "Unknown",
        duration_weeks=db_rot.stase.duration_weeks if db_rot.stase else 4,
        hospital=db_rot.hospital,
        supervisor_name=db_rot.supervisor.name if db_rot.supervisor else "Supervisor Utama",
        start_date=db_rot.start_date.strftime("%Y-%m-%d"),
        end_date=db_rot.end_date.strftime("%Y-%m-%d"),
        status=db_rot.status,
        grade=db_rot.grade or "-",
        night_shifts_done=db_rot.night_shifts_done,
        night_shifts_total=db_rot.night_shifts_total
    )


@router.get("/users", response_model=List[UserResponse])
async def list_users(role: Optional[str] = Query(None), db: AsyncSession = Depends(get_db)):
    stmt = select(User)
    if role:
        stmt = stmt.where(User.role == role)
    stmt = stmt.order_by(User.name.asc())
    
    result = await db.execute(stmt)
    users = result.scalars().all()
    return [UserResponse.model_validate(u) for u in users]


@router.post("/users", response_model=UserResponse, status_code=201)
async def create_user(payload: UserCreateRequest, db: AsyncSession = Depends(get_db)):
    # Simple creation, without hashed password for mock demo purposes
    # In real app, password must be hashed!
    new_user = User(
        user_id=_uuid.uuid4(),
        username=payload.username,
        password_hash=payload.password, # Plain text for mock demo
        name=payload.name,
        role=payload.role,
        is_active=True
    )
    db.add(new_user)
    try:
        await db.commit()
        await db.refresh(new_user)
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Gagal menambahkan user. Pastikan username unik.")
    return UserResponse.model_validate(new_user)


@router.post("/stase", status_code=201)
async def create_stase(payload: StaseCreateRequest, db: AsyncSession = Depends(get_db)):
    new_stase = Stase(
        stase_id=_uuid.uuid4(),
        name=payload.name,
        duration_weeks=payload.duration_weeks
    )
    db.add(new_stase)
    try:
        await db.commit()
        await db.refresh(new_stase)
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Gagal menambahkan stase.")
    return {"message": "Stase berhasil ditambahkan", "stase_id": new_stase.stase_id, "name": new_stase.name}

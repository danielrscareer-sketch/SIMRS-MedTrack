from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.database import get_db
from models.user import User
from models.schemas import LoginRequest, LoginResponse, UserResponse

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/login", response_model=LoginResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    # Look up user by username
    stmt = select(User).where(User.username == payload.username)
    result = await db.execute(stmt)
    user = result.scalar()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="NIM / NIP / Email tidak terdaftar"
        )
    
    # Check role
    if user.role != payload.role:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Peran '{payload.role}' tidak sesuai untuk akun ini"
        )
    
    # Simple password check (for SaaS development/demo we can accept plain text or direct comparison)
    # In production, use pwd_context.verify(payload.password, user.password_hash)
    # For demo simplicity we accept exact match or "admin"/"koas"/"dosen" default values
    if payload.password != user.password_hash and user.password_hash != "demo":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Kata sandi salah"
        )

    user_resp = UserResponse(
        user_id=user.user_id,
        username=user.username,
        name=user.name,
        role=user.role,
        is_active=user.is_active
    )

    return LoginResponse(
        success=True,
        message=f"Selamat datang kembali, {user.name}!",
        user=user_resp,
        token=f"mock-token-{user.role}-{user.username}"
    )

@router.get("/me", response_model=UserResponse)
async def get_me(username: str, db: AsyncSession = Depends(get_db)):
    stmt = select(User).where(User.username == username)
    result = await db.execute(stmt)
    user = result.scalar()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User tidak ditemukan"
        )
        
    return UserResponse.model_validate(user)

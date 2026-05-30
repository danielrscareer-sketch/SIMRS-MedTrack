import uuid
from sqlalchemy import Column, String, Integer, Date, ForeignKey, DateTime, UniqueConstraint, func
from sqlalchemy.orm import relationship
from models.database import Base
from models.user import GUID

class Rotation(Base):
    __tablename__ = "rotations"

    rotation_id        = Column(GUID, primary_key=True, default=uuid.uuid4)
    student_id         = Column(GUID, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    stase_id           = Column(GUID, ForeignKey("stases.stase_id", ondelete="CASCADE"), nullable=False)
    hospital           = Column(String(255), nullable=False) # e.g. "RSUP Dr. Sardjito"
    supervisor_id      = Column(GUID, ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True) # DPJP Dosen
    start_date         = Column(Date, nullable=False)
    end_date           = Column(Date, nullable=False)
    status             = Column(String(50), nullable=False, default="Berjalan") # 'Berjalan', 'Selesai', 'Pending'
    grade              = Column(String(10), default="-") # 'A', 'B', etc.
    night_shifts_done  = Column(Integer, nullable=False, default=0)
    night_shifts_total = Column(Integer, nullable=False, default=5)
    created_at         = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at         = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    stase      = relationship("Stase", back_populates="rotations", lazy="selectin")
    student    = relationship("User", foreign_keys=[student_id], lazy="selectin")
    supervisor = relationship("User", foreign_keys=[supervisor_id], lazy="selectin")
    
    logbooks   = relationship("Logbook", back_populates="rotation", cascade="all, delete", lazy="noload")
    tugas      = relationship("Tugas", back_populates="rotation", cascade="all, delete", lazy="noload")

    __table_args__ = (
        UniqueConstraint("student_id", "stase_id", "start_date", name="uq_student_stase_start"),
    )

import uuid
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import relationship
from models.database import Base
from models.user import GUID

class Stase(Base):
    __tablename__ = "stases"

    stase_id       = Column(GUID, primary_key=True, default=uuid.uuid4)
    name           = Column(String(255), nullable=False, unique=True, index=True)
    duration_weeks = Column(Integer, nullable=False, default=4)
    is_active      = Column(Boolean, nullable=False, default=True)
    created_at     = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at     = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    targets   = relationship("CompetencyTarget", back_populates="stase", cascade="all, delete-orphan", lazy="selectin")
    rotations = relationship("Rotation", back_populates="stase", cascade="all, delete", lazy="noload")


class CompetencyTarget(Base):
    __tablename__ = "competency_targets"

    target_id    = Column(GUID, primary_key=True, default=uuid.uuid4)
    stase_id     = Column(GUID, ForeignKey("stases.stase_id", ondelete="CASCADE"), nullable=False)
    case_name    = Column(String(255), nullable=False)
    target_count = Column(Integer, nullable=False, default=1)
    level        = Column(String(20), nullable=False) # e.g. "4A", "3B"
    created_at   = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at   = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    stase    = relationship("Stase", back_populates="targets")
    progress = relationship("CompetencyProgress", back_populates="target", cascade="all, delete", lazy="noload")

    __table_args__ = (
        UniqueConstraint("stase_id", "case_name", name="uq_stase_case_name"),
    )


class CompetencyProgress(Base):
    __tablename__ = "student_competency_progress"

    progress_id    = Column(GUID, primary_key=True, default=uuid.uuid4)
    student_id     = Column(GUID, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    target_id      = Column(GUID, ForeignKey("competency_targets.target_id", ondelete="CASCADE"), nullable=False)
    achieved_count = Column(Integer, nullable=False, default=0)
    created_at     = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at     = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    target = relationship("CompetencyTarget", back_populates="progress", lazy="selectin")

    __table_args__ = (
        UniqueConstraint("student_id", "target_id", name="uq_student_target"),
    )

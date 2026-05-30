import uuid
from sqlalchemy import Column, String, Integer, Date, DateTime, Text, ForeignKey, func
from sqlalchemy.orm import relationship
from models.database import Base
from models.user import GUID

class Tugas(Base):
    __tablename__ = "tugas"

    tugas_id        = Column(GUID, primary_key=True, default=uuid.uuid4)
    student_id      = Column(GUID, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    rotation_id     = Column(GUID, ForeignKey("rotations.rotation_id", ondelete="CASCADE"), nullable=False)
    title           = Column(String(255), nullable=False) # e.g. "Pemaparan Jurnal", "Laporan Kasus"
    description     = Column(Text)
    due_date        = Column(Date, nullable=False)
    status          = Column(String(50), nullable=False, default="Belum Selesai") # 'Belum Selesai', 'Menunggu Penilaian', 'Selesai'
    grade           = Column(String(10), default="-") # A, B+, etc.
    score           = Column(Integer) # 0-100
    comment         = Column(Text)
    submission_file = Column(String(255)) # PDF file path/URL
    submitted_at    = Column(DateTime(timezone=True))
    created_at      = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at      = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    student  = relationship("User", foreign_keys=[student_id], lazy="selectin")
    rotation = relationship("Rotation", back_populates="tugas", lazy="selectin")

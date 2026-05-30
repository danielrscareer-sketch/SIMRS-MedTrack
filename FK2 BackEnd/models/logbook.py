import uuid
from sqlalchemy import Column, String, Integer, Boolean, Date, DateTime, Text, ForeignKey, func
from sqlalchemy.orm import relationship
from models.database import Base
from models.user import GUID

class Logbook(Base):
    __tablename__ = "logbooks"

    log_id                    = Column(GUID, primary_key=True, default=uuid.uuid4)
    student_id                = Column(GUID, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    rotation_id               = Column(GUID, ForeignKey("rotations.rotation_id", ondelete="CASCADE"), nullable=False)
    date                      = Column(Date, nullable=False, default=func.current_date)
    rm                        = Column(String(50), nullable=False) # Rekam Medis
    diagnosis                 = Column(String(255), nullable=False)
    action                    = Column(String(255), nullable=False)
    peran                     = Column(String(50), nullable=False) # 'Mandiri', 'Asistensi', 'Observasi'
    is_jaga_malam             = Column(Boolean, nullable=False, default=False)
    dokter_spesialis          = Column(String(255)) # Supervisor/DPJP name
    dokter_unit               = Column(String(255), nullable=False) # IGD / Ward doctor
    dokter_konsul             = Column(String(255))
    triage                    = Column(String(100)) # Merah, Kuning, Hijau
    skala_nyeri               = Column(String(20)) # 0-10
    informed_consent          = Column(String(100)) # Telah Diberikan / Belum
    lampiran                  = Column(String(255)) # PDF or image file path/URL
    status                    = Column(String(50), nullable=False, default="pending") # 'pending', 'approved', 'rejected'
    revision_note             = Column(Text)
    score                     = Column(Integer) # 0-100
    comment                   = Column(Text) # Supervisor comments

    # Clinical SOAP Notes
    soap_subjective_sekarang  = Column(Text, nullable=False)
    soap_subjective_dahulu    = Column(Text)
    soap_obj_keadaan_umum     = Column(String(255), nullable=False)
    soap_obj_kesadaran        = Column(String(100), nullable=False)
    soap_obj_td               = Column(String(50))
    soap_obj_nadi             = Column(String(50))
    soap_obj_rr               = Column(String(50))
    soap_obj_suhu             = Column(String(50))
    soap_obj_lainnya          = Column(Text)
    soap_asses_kerja          = Column(String(255), nullable=False)
    soap_asses_banding        = Column(String(255))
    soap_plan_medikamentosa   = Column(Text, nullable=False)
    soap_plan_non_medikamentosa = Column(Text)
    soap_plan_sosial          = Column(Text)

    created_at                = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at                = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    student  = relationship("User", foreign_keys=[student_id], lazy="selectin")
    rotation = relationship("Rotation", back_populates="logbooks", lazy="selectin")

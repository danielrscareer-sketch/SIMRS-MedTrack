from __future__ import annotations
import uuid
from datetime import datetime, date
from typing import Optional, List, Dict
from pydantic import BaseModel, Field, ConfigDict

# ── Auth Schemas ──────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    username: str = Field(..., description="NIM for student, NIP or Email for Dosen/Admin")
    password: str = Field(..., description="Plain password")
    role: str = Field(..., description="Role chosen in UI: 'mahasiswakoas', 'dosen', 'admin'")


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    user_id: uuid.UUID
    username: str
    name: str
    role: str
    is_active: bool


class LoginResponse(BaseModel):
    success: bool
    message: str
    user: Optional[UserResponse] = None
    token: Optional[str] = "mocked-jwt-token"  # Simplifies development


# ── Stase & Rotation Schemas ──────────────────────────────────────────────────

class RotationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    rotation_id: uuid.UUID
    student_id: uuid.UUID
    stase_id: uuid.UUID
    stase_name: str
    duration_weeks: int
    hospital: str
    supervisor_name: str
    start_date: str
    end_date: str
    status: str
    grade: str
    night_shifts_done: int
    night_shifts_total: int


class CompetencyTargetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    target_id: uuid.UUID
    stase_id: uuid.UUID
    case_name: str
    target_count: int
    level: str
    achieved_count: int


class ActiveStaseResponse(BaseModel):
    current_stase: Optional[RotationResponse] = None
    targets: List[CompetencyTargetResponse] = []


class RotationCreateRequest(BaseModel):
    student_id: uuid.UUID
    stase_id: uuid.UUID
    hospital: str
    supervisor_id: uuid.UUID
    start_date: date
    end_date: date
    night_shifts_total: int = 5


# ── Logbook SOAP Schemas ──────────────────────────────────────────────────────

class SOAPNotes(BaseModel):
    subjectiveSekarang: str
    subjectiveDahulu: Optional[str] = ""
    objKeadaanUmum: str
    objKesadaran: str
    objTD: Optional[str] = ""
    objNadi: Optional[str] = ""
    objRR: Optional[str] = ""
    objSuhu: Optional[str] = ""
    objLainnya: Optional[str] = ""
    assesKerja: str
    assesBanding: Optional[str] = ""
    planMedikamentosa: str
    planNonMedikamentosa: Optional[str] = ""
    planSosial: Optional[str] = ""


class LogbookCreateRequest(BaseModel):
    date: date
    rm: str
    diagnosis: str
    action: str
    peran: str  # 'Mandiri', 'Asistensi', 'Observasi'
    isJagaMalam: bool
    dokterSpesialis: Optional[str] = ""
    dokterUnit: str
    dokterKonsul: Optional[str] = ""
    triage: Optional[str] = "Hijau (Biasa)"
    skalaNyeri: Optional[str] = "0"
    informedConsent: Optional[str] = "Telah Diberikan (Setuju)"
    lampiran: Optional[str] = ""
    soap: SOAPNotes


class LogbookResponse(BaseModel):
    id: str
    studentName: str
    date: str
    stase: str
    diagnosis: str
    action: str
    rm: str
    peran: str
    soap: SOAPNotes
    kondisiPasien: str
    isJagaMalam: bool
    dokterSpesialis: str
    dokterUnit: str
    dokterKonsul: Optional[str] = ""
    triage: str
    skalaNyeri: str
    informedConsent: str
    lampiran: Optional[str] = ""
    status: str  # 'pending', 'approved', 'rejected'
    revisionNote: Optional[str] = ""
    score: Optional[int] = None
    comment: Optional[str] = ""


class LogbookValidationRequest(BaseModel):
    status: str  # 'approved' or 'rejected'
    score: Optional[int] = None  # 0-100
    comment: Optional[str] = ""
    revisionNote: Optional[str] = ""


# ── Tugas Schemas ─────────────────────────────────────────────────────────────

class TugasResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = ""
    dueDate: str
    status: str  # 'Belum Selesai', 'Menunggu Penilaian', 'Selesai'
    grade: str
    score: Optional[int] = None
    comment: Optional[str] = ""
    submissionFile: Optional[str] = ""
    submittedAt: Optional[str] = ""


class TugasSubmitRequest(BaseModel):
    submissionFile: str


class TugasValidationRequest(BaseModel):
    score: int
    comment: Optional[str] = ""


# ── Admin & TU Schemas ─────────────────────────────────────────────────────────

class RekapNilaiResponse(BaseModel):
    studentName: str
    nim: str
    grades: Dict[str, str]  # { stase_name: final_grade }


class UserCreateRequest(BaseModel):
    username: str
    password: str
    name: str
    role: str # 'mahasiswakoas', 'dosen', 'admin'


class StaseCreateRequest(BaseModel):
    name: str
    duration_weeks: int = 4

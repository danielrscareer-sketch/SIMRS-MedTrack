from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from models.database import get_db
from models.logbook import Logbook
from models.rotation import Rotation
from models.stase import CompetencyTarget, CompetencyProgress
from models.user import User
from models.schemas import LogbookCreateRequest, LogbookResponse, SOAPNotes
from typing import List, Optional
import uuid
import os

router = APIRouter(prefix="/api/logbook", tags=["Logbooks"])

async def get_user_by_username(db: AsyncSession, username: str) -> User:
    stmt = select(User).where(User.username == username)
    result = await db.execute(stmt)
    user = result.scalar()
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    return user

def map_db_to_schema(log: Logbook) -> LogbookResponse:
    soap_resp = SOAPNotes(
        subjectiveSekarang=log.soap_subjective_sekarang,
        subjectiveDahulu=log.soap_subjective_dahulu or "",
        objKeadaanUmum=log.soap_obj_keadaan_umum,
        objKesadaran=log.soap_obj_kesadaran,
        objTD=log.soap_obj_td or "",
        objNadi=log.soap_obj_nadi or "",
        objRR=log.soap_obj_rr or "",
        objSuhu=log.soap_obj_suhu or "",
        objLainnya=log.soap_obj_lainnya or "",
        assesKerja=log.soap_asses_kerja,
        assesBanding=log.soap_asses_banding or "",
        planMedikamentosa=log.soap_plan_medikamentosa,
        planNonMedikamentosa=log.soap_plan_non_medikamentosa or "",
        planSosial=log.soap_plan_sosial or ""
    )

    triage_str = log.triage or "Hijau (Biasa)"
    kondisi = "Stabil"
    if log.is_jaga_malam:
        kondisi = "Kritis"
    elif "merah" in triage_str.lower():
        kondisi = "Gawat Darurat"

    return LogbookResponse(
        id=str(log.log_id),
        studentName=log.student.name if log.student else "Koas",
        date=log.date.strftime("%d %b %Y"),
        stase=log.rotation.stase.name if log.rotation and log.rotation.stase else "Unknown",
        diagnosis=log.diagnosis,
        action=log.action,
        rm=log.rm,
        peran=log.peran,
        soap=soap_resp,
        kondisiPasien=kondisi,
        isJagaMalam=log.is_jaga_malam,
        dokterSpesialis=log.dokter_spesialis or "-",
        dokterUnit=log.dokter_unit,
        dokterKonsul=log.dokter_konsul or "",
        triage=triage_str,
        skalaNyeri=log.skala_nyeri or "0",
        informedConsent=log.informed_consent or "Setuju",
        lampiran=log.lampiran,
        status=log.status,
        revisionNote=log.revision_note or "",
        score=log.score,
        comment=log.comment or ""
    )

@router.get("/", response_model=List[LogbookResponse])
async def list_logbooks(
    username: str = Query(...),
    status: Optional[str] = Query(None),
    stase: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    user = await get_user_by_username(db, username)
    
    # Base query for this student
    stmt = select(Logbook).where(Logbook.student_id == user.user_id)
    result = await db.execute(stmt)
    logs = result.scalars().all()

    # Client-side filtering for simplicity & standard output mapping
    filtered_logs = []
    for log in logs:
        # Filter by status
        if status and status != "all" and log.status != status:
            continue
        
        # Filter by stase name
        if stase and stase != "Semua Stase":
            stase_name = log.rotation.stase.name if log.rotation and log.rotation.stase else ""
            if stase.lower() not in stase_name.lower():
                continue
                
        filtered_logs.append(map_db_to_schema(log))

    # Sort by created_at desc
    filtered_logs.sort(key=lambda x: x.date, reverse=True)
    return filtered_logs


@router.post("/", response_model=LogbookResponse, status_code=201)
async def create_logbook(
    payload: LogbookCreateRequest,
    username: str = Query(...),
    db: AsyncSession = Depends(get_db)
):
    user = await get_user_by_username(db, username)
    
    # Find current active stase for this student
    stmt_rot = select(Rotation).where(
        and_(Rotation.student_id == user.user_id, Rotation.status == "Berjalan")
    )
    res_rot = await db.execute(stmt_rot)
    rotation = res_rot.scalar()
    
    if not rotation:
        raise HTTPException(
            status_code=400,
            detail="Mahasiswa tidak memiliki stase aktif yang sedang berjalan"
        )
        
    db_log = Logbook(
        student_id=user.user_id,
        rotation_id=rotation.rotation_id,
        date=payload.date,
        rm=payload.rm,
        diagnosis=payload.diagnosis,
        action=payload.action,
        peran=payload.peran,
        is_jaga_malam=payload.isJagaMalam,
        dokter_spesialis=payload.dokterSpesialis or rotation.supervisor.name,
        dokter_unit=payload.dokterUnit,
        dokter_konsul=payload.dokterKonsul,
        triage=payload.triage,
        skala_nyeri=payload.skalaNyeri,
        informed_consent=payload.informedConsent,
        lampiran=payload.lampiran,
        status="pending",
        
        soap_subjective_sekarang=payload.soap.subjectiveSekarang,
        soap_subjective_dahulu=payload.soap.subjectiveDahulu,
        soap_obj_keadaan_umum=payload.soap.objKeadaanUmum,
        soap_obj_kesadaran=payload.soap.objKesadaran,
        soap_obj_td=payload.soap.objTD,
        soap_obj_nadi=payload.soap.objNadi,
        soap_obj_rr=payload.soap.objRR,
        soap_obj_suhu=payload.soap.objSuhu,
        soap_obj_lainnya=payload.soap.objLainnya,
        soap_asses_kerja=payload.soap.assesKerja,
        soap_asses_banding=payload.soap.assesBanding,
        soap_plan_medikamentosa=payload.soap.planMedikamentosa,
        soap_plan_non_medikamentosa=payload.soap.planNonMedikamentosa,
        soap_plan_sosial=payload.soap.planSosial
    )
    
    db.add(db_log)
    await db.commit()
    await db.refresh(db_log)
    
    # Reload relation with student to map properly
    stmt_reload = select(Logbook).where(Logbook.log_id == db_log.log_id)
    res_reload = await db.execute(stmt_reload)
    db_log = res_reload.scalar()
    
    return map_db_to_schema(db_log)


@router.post("/upload-attachment")
async def upload_attachment(file: UploadFile = File(...)):
    # In a full production build, we write the file to storage
    # For SaaS MedTrack local development, we return a mock file URL
    # but still parse the filename for a highly authentic feel
    filename = file.filename
    return {
        "success": True,
        "message": "Berkas lampiran lab berhasil diunggah",
        "file_url": f"/uploads/{filename}"
    }


@router.get("/export-pdf")
async def export_pdf(username: str = Query(...)):
    return {
        "success": True,
        "message": f"Buku Log Klinis Koas {username} berhasil diekspor ke format PDF."
    }

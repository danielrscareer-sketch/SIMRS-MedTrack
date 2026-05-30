from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from models.database import get_db
from models.logbook import Logbook
from models.rotation import Rotation
from models.stase import CompetencyTarget, CompetencyProgress
from models.tugas import Tugas
from models.user import User
from models.schemas import LogbookResponse, LogbookValidationRequest, SOAPNotes, TugasResponse, TugasValidationRequest
from typing import List, Optional
import uuid

router = APIRouter(prefix="/api/dosen", tags=["Dosen / Supervisor Dashboard"])

async def get_user_by_username(db: AsyncSession, username: str) -> User:
    stmt = select(User).where(User.username == username)
    result = await db.execute(stmt)
    user = result.scalar()
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    return user

def convert_score_to_grade(score: int) -> str:
    if score >= 85: return 'A'
    if score >= 80: return 'A-'
    if score >= 75: return 'B+'
    if score >= 70: return 'B'
    if score >= 65: return 'C+'
    if score >= 60: return 'C'
    if score >= 50: return 'D'
    return 'E'

def map_db_to_logbook_response(log: Logbook) -> LogbookResponse:
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
        date=log.date.strftime("Tindakan: %d %b %Y"),
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


@router.get("/validasi-list", response_model=List[LogbookResponse])
async def list_pending_logbooks(username: str = Query(...), db: AsyncSession = Depends(get_db)):
    dosen = await get_user_by_username(db, username)
    
    # Get all logbooks that are pending and belong to rotations supervised by this lecturer
    stmt = select(Logbook).join(Rotation).where(
        and_(Rotation.supervisor_id == dosen.user_id, Logbook.status == "pending")
    )
    result = await db.execute(stmt)
    logs = result.scalars().all()
    
    return [map_db_to_logbook_response(l) for l in logs]


@router.post("/validasi/{log_id}", response_model=LogbookResponse)
async def validate_logbook(
    log_id: uuid.UUID,
    payload: LogbookValidationRequest,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Logbook).where(Logbook.log_id == log_id)
    result = await db.execute(stmt)
    log = result.scalar()
    
    if not log:
        raise HTTPException(status_code=404, detail="Entri logbook tidak ditemukan")
        
    log.status = payload.status
    log.score = payload.score
    log.comment = payload.comment
    log.revision_note = payload.revisionNote
    
    # Integrate target progress increments automatically upon approval
    if payload.status == "approved" and log.rotation:
        # Check if there is a matching competency target for this diagnosis in the active stase
        # Match using case_name (case-insensitive substring comparison)
        stmt_target = select(CompetencyTarget).where(
            and_(
                CompetencyTarget.stase_id == log.rotation.stase_id,
                CompetencyTarget.case_name.ilike(f"%{log.diagnosis}%")
            )
        )
        res_target = await db.execute(stmt_target)
        target = res_target.scalar()
        
        # If not exact match, check if any target name is contained in the diagnosis
        if not target:
            stmt_targets = select(CompetencyTarget).where(CompetencyTarget.stase_id == log.rotation.stase_id)
            res_targets = await db.execute(stmt_targets)
            all_targets = res_targets.scalars().all()
            for tgt in all_targets:
                if tgt.case_name.lower() in log.diagnosis.lower() or log.diagnosis.lower() in tgt.case_name.lower():
                    target = tgt
                    break
        
        if target:
            # Check or create progress
            stmt_prog = select(CompetencyProgress).where(
                and_(
                    CompetencyProgress.student_id == log.student_id,
                    CompetencyProgress.target_id == target.target_id
                )
            )
            res_prog = await db.execute(stmt_prog)
            prog = res_prog.scalar()
            
            if prog:
                prog.achieved_count += 1
            else:
                db_prog = CompetencyProgress(
                    student_id=log.student_id,
                    target_id=target.target_id,
                    achieved_count=1
                )
                db.add(db_prog)
                
        # If it was a night shift, update shifts done in rotation
        if log.is_jaga_malam:
            log.rotation.night_shifts_done = min(
                log.rotation.night_shifts_done + 1,
                log.rotation.night_shifts_total
            )

    await db.commit()
    await db.refresh(log)
    
    # Reload relation
    stmt_reload = select(Logbook).where(Logbook.log_id == log.log_id)
    res_reload = await db.execute(stmt_reload)
    log = res_reload.scalar()
    
    return map_db_to_logbook_response(log)


@router.get("/validasi-tugas-list", response_model=List[TugasResponse])
async def list_pending_tugas(username: str = Query(...), db: AsyncSession = Depends(get_db)):
    dosen = await get_user_by_username(db, username)
    
    # Get all assignments that are 'Menunggu Penilaian' and supervised by this lecturer
    stmt = select(Tugas).join(Rotation).where(
        and_(Rotation.supervisor_id == dosen.user_id, Tugas.status == "Menunggu Penilaian")
    )
    result = await db.execute(stmt)
    tugas_list = result.scalars().all()
    
    response = []
    for t in tugas_list:
        response.append(
            TugasResponse(
                id=str(t.tugas_id),
                title=f"{t.student.name} — {t.title}" if t.student else t.title,
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


@router.post("/validasi-tugas/{tugas_id}", response_model=TugasResponse)
async def grade_tugas(
    tugas_id: uuid.UUID,
    payload: TugasValidationRequest,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Tugas).where(Tugas.tugas_id == tugas_id)
    result = await db.execute(stmt)
    t = result.scalar()
    
    if not t:
        raise HTTPException(status_code=404, detail="Tugas tidak ditemukan")
        
    t.score = payload.score
    t.grade = convert_score_to_grade(payload.score)
    t.comment = payload.comment
    t.status = "Selesai"
    
    # Check if this assignment grading completes all assignments, we could optionally update stase grade
    # But let's leave rotation grade mapping to Admin TU for formal approval
    
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


@router.get("/mahasiswa-bimbingan")
async def list_bimbingan_students(username: str = Query(...), db: AsyncSession = Depends(get_db)):
    dosen = await get_user_by_username(db, username)
    
    # Find active rotations supervised by this lecturer
    stmt = select(Rotation).where(
        and_(Rotation.supervisor_id == dosen.user_id, Rotation.status == "Berjalan")
    )
    result = await db.execute(stmt)
    rotations = result.scalars().all()
    
    students_list = []
    for r in rotations:
        # Calculate some summary stats for each student
        # Total logbooks submitted and approved
        stmt_logs = select(Logbook).where(Logbook.rotation_id == r.rotation_id)
        res_logs = await db.execute(stmt_logs)
        logs = res_logs.scalars().all()
        
        total_logs = len(logs)
        approved_logs = len([l for l in logs if l.status == "approved"])
        pending_logs = len([l for l in logs if l.status == "pending"])
        
        students_list.append({
            "rotation_id": str(r.rotation_id),
            "student_id": str(r.student_id),
            "studentName": r.student.name if r.student else "Koas",
            "nim": r.student.username if r.student else "-",
            "hospital": r.hospital,
            "staseName": r.stase.name if r.stase else "Unknown",
            "totalLogs": total_logs,
            "approvedLogs": approved_logs,
            "pendingLogs": pending_logs,
            "shiftsDone": r.night_shifts_done,
            "shiftsTotal": r.night_shifts_total,
        })
        
    return {
        "success": True,
        "count": len(students_list),
        "students": students_list
    }

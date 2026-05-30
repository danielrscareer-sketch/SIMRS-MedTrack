import asyncio
from datetime import date
from sqlalchemy import select, and_
from models.database import AsyncSessionLocal
from models.user import User
from models.stase import CompetencyProgress, CompetencyTarget
from models.logbook import Logbook
from routers.auth import login
from models.schemas import LoginRequest, LogbookCreateRequest, SOAPNotes, LogbookValidationRequest
from routers.stase import get_current_stase
from routers.logbook import create_logbook, list_logbooks
from routers.dosen import list_pending_logbooks, validate_logbook

async def test_integration():
    print("=== STARTING INTEGRATION TEST ===")
    async with AsyncSessionLocal() as db:
        # 1. Test Login
        print("\n1. Testing Login Flow...")
        req = LoginRequest(username="koas", password="demo", role="mahasiswakoas")
        res = await login(req, db)
        assert res.success == True
        print(f"   [SUCCESS] Login Koas Succeeded: {res.message}")
        
        # 2. Test Get Active Stase
        print("\n2. Testing Get Active Stase & Competency Targets...")
        active_stase = await get_current_stase(username="koas", db=db)
        assert active_stase.current_stase is not None
        print(f"   [SUCCESS] Active Stase: {active_stase.current_stase.stase_name} at {active_stase.current_stase.hospital}")
        print(f"   [INFO] Competency Targets:")
        for tgt in active_stase.targets:
            print(f"      - {tgt.case_name}: achieved {tgt.achieved_count} of {tgt.target_count} (Level {tgt.level})")

        # 3. Create a New SOAP Logbook Entry for Typhoid Fever
        print("\n3. Submitting a new Logbook Entry...")
        soap = SOAPNotes(
            subjectiveSekarang="Demam tinggi naik-turun terutama sore hari sejak 5 hari, lidah kotor (+).",
            objKeadaanUmum="Sakit Sedang / Lemas",
            objKesadaran="Compos Mentis",
            objTD="110/80",
            objNadi="80",
            objRR="18",
            objSuhu="38.2",
            objLainnya="Lidah kotor dengan tepi hiperemis (typhoid tongue) (+). Widal test 1/320.",
            assesKerja="Demam Tifoid (Typhoid Fever)",

            planMedikamentosa="Levofloxacin 500mg IV per 24 jam. Paracetamol 500mg prn.",
            planNonMedikamentosa="Tirah baring (bed rest total). Diet lunak rendah serat.",
            planSosial="Edukasi kebersihan makanan dan pembatasan aktivitas fisik selama fase akut."
        )
        logbook_payload = LogbookCreateRequest(
            date=date.today(),
            rm="RM-88910",
            diagnosis="Typhoid Fever",
            action="Pemberian Terapi Antibiotik IV",
            peran="Mandiri",
            isJagaMalam=False,
            dokterSpesialis="",
            dokterUnit="Bangsal Flamboyan",
            soap=soap
        )
        
        new_log = await create_logbook(payload=logbook_payload, username="koas", db=db)
        print(f"   [SUCCESS] Logbook Created: ID {new_log.id} - Status: {new_log.status}")

        # 4. Check Lecturer Validation Queue
        print("\n4. Checking Lecturer's Validation Queue...")
        pending_list = await list_pending_logbooks(username="dosen", db=db)
        matching_pending = [l for l in pending_list if l.id == new_log.id]
        assert len(matching_pending) == 1
        print(f"   [SUCCESS] Logbook is in Lecturer's queue. Diagnosis: '{matching_pending[0].diagnosis}'")

        # 5. Dosen Validates/Approves the Logbook
        print("\n5. Dosen Approving and Grading Logbook...")
        validation_payload = LogbookValidationRequest(
            status="approved",
            score=90,
            comment="Analisis SOAP sangat baik dan penegakan diagnosis tepat."
        )
        
        import uuid
        approved_log = await validate_logbook(
            log_id=uuid.UUID(new_log.id),
            payload=validation_payload,
            db=db
        )
        assert approved_log.status == "approved"
        assert approved_log.score == 90
        print(f"   [SUCCESS] Logbook Approved by Dosen: Status '{approved_log.status}', Score: {approved_log.score}")

        # 6. Verify Competency Progress auto-incremented
        print("\n6. Verifying Competency Progress Auto-Increment...")
        # Typhoid Fever achieved_count was 3, should now be 4!
        active_stase_after = await get_current_stase(username="koas", db=db)
        typhoid_target = [t for t in active_stase_after.targets if "Typhoid" in t.case_name][0]
        assert typhoid_target.achieved_count == 4
        print(f"   [SUCCESS] Typhoid Fever achieved count updated to: {typhoid_target.achieved_count} (expected: 4)")

    print("\n=== ALL INTEGRATION TESTS PASSED SUCCESSFULLY ===")

if __name__ == "__main__":
    asyncio.run(test_integration())

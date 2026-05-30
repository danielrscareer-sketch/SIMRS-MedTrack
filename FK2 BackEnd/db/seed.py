import asyncio
from datetime import date, datetime, timedelta
from sqlalchemy import select
from models.database import AsyncSessionLocal
from models.user import User
from models.stase import Stase, CompetencyTarget, CompetencyProgress
from models.rotation import Rotation
from models.logbook import Logbook
from models.tugas import Tugas

async def seed():
    print("Seeding SIMRS MedTrack database...")
    async with AsyncSessionLocal() as db:
        # 1. Create Users
        # Koas, Dosen, and Admin
        koas = User(
            username="koas",
            password_hash="demo", # Plain comparison supported in dev
            name="Andi Saputra",
            role="mahasiswakoas",
            is_active=True
        )
        
        dosen = User(
            username="dosen",
            password_hash="demo",
            name="Dr. Budi Santoso, Sp.PD",
            role="dosen",
            is_active=True
        )
        
        admin = User(
            username="admin",
            password_hash="demo",
            name="Staff Tata Usaha FK",
            role="admin",
            is_active=True
        )
        
        db.add_all([koas, dosen, admin])
        await db.flush() # Flush to populate user_ids
        print(f"  -> Created Users: {koas.name} (Koas), {dosen.name} (Dosen), {admin.name} (Admin)")

        # 2. Create Stases (Departments)
        ipd = Stase(name="Ilmu Penyakit Dalam", duration_weeks=4)
        bedah = Stase(name="Ilmu Bedah", duration_weeks=4)
        anak = Stase(name="Ilmu Kesehatan Anak", duration_weeks=4)
        obgyn = Stase(name="Obstetri & Ginekologi", duration_weeks=4)
        
        db.add_all([ipd, bedah, anak, obgyn])
        await db.flush()
        print("  -> Created Stases/Departments")

        # 3. Create Competency Targets for Penyakit Dalam
        t1 = CompetencyTarget(stase_id=ipd.stase_id, case_name="Dengue Hemorrhagic Fever", target_count=5, level="4A")
        t2 = CompetencyTarget(stase_id=ipd.stase_id, case_name="Typhoid Fever", target_count=3, level="4A")
        t3 = CompetencyTarget(stase_id=ipd.stase_id, case_name="Acute Myocardial Infarction", target_count=2, level="3B")
        t4 = CompetencyTarget(stase_id=ipd.stase_id, case_name="Pneumonia", target_count=4, level="4A")
        
        db.add_all([t1, t2, t3, t4])
        await db.flush()
        print("  -> Created Competency Targets")

        # 4. Create Competency Progress for student Andi
        p1 = CompetencyProgress(student_id=koas.user_id, target_id=t1.target_id, achieved_count=4)
        p2 = CompetencyProgress(student_id=koas.user_id, target_id=t2.target_id, achieved_count=3)
        p3 = CompetencyProgress(student_id=koas.user_id, target_id=t3.target_id, achieved_count=1)
        p4 = CompetencyProgress(student_id=koas.user_id, target_id=t4.target_id, achieved_count=2)
        
        db.add_all([p1, p2, p3, p4])
        print("  -> Created student competency targets progress")

        # 5. Create Rotations (Plotting) for Koas Andi Saputra
        # Active Stase: Penyakit Dalam
        active_rot = Rotation(
            student_id=koas.user_id,
            stase_id=ipd.stase_id,
            hospital="RSUP Dr. Sardjito",
            supervisor_id=dosen.user_id,
            start_date=date(2026, 10, 1),
            end_date=date(2026, 10, 28),
            status="Berjalan",
            grade="-",
            night_shifts_done=3,
            night_shifts_total=5
        )
        
        # History Stase 1: Ilmu Bedah
        hist_rot1 = Rotation(
            student_id=koas.user_id,
            stase_id=bedah.stase_id,
            hospital="RSUD Jejaring",
            supervisor_id=dosen.user_id,
            start_date=date(2026, 8, 1),
            end_date=date(2026, 8, 28),
            status="Selesai",
            grade="A",
            night_shifts_done=5,
            night_shifts_total=5
        )

        # History Stase 2: Ilmu Kesehatan Anak
        hist_rot2 = Rotation(
            student_id=koas.user_id,
            stase_id=anak.stase_id,
            hospital="RSUP Dr. Sardjito",
            supervisor_id=dosen.user_id,
            start_date=date(2026, 9, 1),
            end_date=date(2026, 9, 28),
            status="Selesai",
            grade="A-",
            night_shifts_done=4,
            night_shifts_total=5
        )
        
        db.add_all([active_rot, hist_rot1, hist_rot2])
        await db.flush()
        print("  -> Plotted Rotations (Current & History)")

        # 6. Create Logbook SOAP Entries (Matching Frontend DUMMY_LOGS)
        log1 = Logbook(
            student_id=koas.user_id,
            rotation_id=active_rot.rotation_id,
            date=date(2026, 10, 18),
            rm="RM-44919",
            diagnosis="DHF Grade II",
            action="Pemasangan IV Line & Resusitasi Cairan",
            peran="Mandiri",
            is_jaga_malam=False,
            dokter_spesialis=dosen.name,
            dokter_unit="dr. Indah (Jaga poli)",
            triage="Merah (Gawat Darurat)",
            skala_nyeri="7",
            informed_consent="Telah Diberikan (Setuju)",
            lampiran="EKG_DHF_Andi.pdf",
            status="approved",
            score=85,
            comment="Tindakan resusitasi tepat, anamnesis SOAP lengkap dan informatif.",
            
            soap_subjective_sekarang="Demam tinggi 4 hari SMRS, mual, muntah 3x, lemas. Nyeri ulu hati (+).",
            soap_subjective_dahulu="Riwayat tifus 1 tahun lalu. Alergi obat (-).",
            soap_obj_keadaan_umum="Sakit Sedang / Lemah",
            soap_obj_kesadaran="Compos Mentis",
            soap_obj_td="90/60",
            soap_obj_nadi="110",
            soap_obj_rr="22",
            soap_obj_suhu="38.5",
            soap_obj_lainnya="Akral mulai dingin, CRT 3 detik. Ptekie (+) di kedua ekstremitas bawah. Trombosit 45.000, Ht 48%.",
            soap_asses_kerja="Dengue Hemorrhagic Fever (DHF) Grade II dengan impending shock.",
            soap_asses_banding="Demam Tifoid, Leptospirosis",
            soap_plan_medikamentosa="Loading cairan RL 15-20 cc/kgBB. Paracetamol IV 1g prn.",
            soap_plan_non_medikamentosa="Pemasangan IV line 18G.",
            soap_plan_sosial="Observasi ketat tanda vital dan produksi urin tiap jam. Edukasi keluarga mengenai kondisi gawat."
        )

        log2 = Logbook(
            student_id=koas.user_id,
            rotation_id=active_rot.rotation_id,
            date=date(2026, 10, 17),
            rm="RM-59912",
            diagnosis="STEMI Anterior Extensif",
            action="Interpretasi EKG 12 Lead",
            peran="Asistensi",
            is_jaga_malam=True,
            dokter_spesialis="",
            dokter_unit="dr. Ridwan (IGD)",
            dokter_konsul=dosen.name + " (via Telp)",
            triage="Merah (Gawat Darurat)",
            skala_nyeri="9",
            informed_consent="Telah Diberikan (Setuju)",
            lampiran="STEMI_V1_V6_Budi.png",
            status="pending",
            
            soap_subjective_sekarang="Nyeri dada kiri khas ampek/tertindih beban berat sejak 2 jam SMRS, keringat dingin (+).",
            soap_subjective_dahulu="Hipertensi kronis tidak terkontrol. Merokok 1 bungkus/hari.",
            soap_obj_keadaan_umum="Tampak Kesakitan",
            soap_obj_kesadaran="Compos Mentis",
            soap_obj_td="140/90",
            soap_obj_nadi="88",
            soap_obj_rr="24",
            soap_obj_suhu="36.8",
            soap_obj_lainnya="EKG: ST Elevasi di V1-V6, I, aVL. Enzim jantung Troponin I (+).",
            soap_asses_kerja="STEMI Anterior Ekstensif akut.",
            soap_plan_medikamentosa="Mulai injeksi Fibrinolitik (Streptokinase) di IGD. ISDN sublingual.",
            soap_plan_non_medikamentosa="Pemasangan EKG 12 Lead (Asistensi). O2 nasal kanul 3 lpm.",
            soap_plan_sosial="Kolaborasi lapor DPJP. Edukasi keluarga mengenai risiko."
        )

        log3 = Logbook(
            student_id=koas.user_id,
            rotation_id=active_rot.rotation_id,
            date=date(2026, 10, 15),
            rm="RM-11204",
            diagnosis="Apendisitis Akut",
            action="Asisten 2 Appendectomy Cito",
            peran="Observasi",
            is_jaga_malam=True,
            dokter_spesialis="dr. Herman, Sp.B",
            dokter_unit="dr. Jaka (OK)",
            triage="Kuning (Urgent)",
            skala_nyeri="6",
            informed_consent="Telah Diberikan (Setuju)",
            status="rejected",
            revision_note="Tolong lengkapi penjabaran Plan (P) dengan detail edukasi gizi pasien pasca-operasi apendisitis.",
            
            soap_subjective_sekarang="Nyeri perut kanan bawah hebat mendadak, mual (+), muntah 1x.",
            soap_subjective_dahulu="Riwayat maag sering kambuh.",
            soap_obj_keadaan_umum="Sakit Sedang",
            soap_obj_kesadaran="Compos Mentis",
            soap_obj_td="120/80",
            soap_obj_nadi="96",
            soap_obj_rr="20",
            soap_obj_suhu="37.9",
            soap_obj_lainnya="Nyeri tekan perut kanan bawah McBurney (+). Rebound tenderness (+). Leukositosis 16.000.",
            soap_asses_kerja="Apendisitis Akut.",
            soap_plan_medikamentosa="Ceftriaxone IV 1g profilaksis. Ketorolac IV 30mg.",
            soap_plan_non_medikamentosa="Puasa pre-op. Rencana Appendectomy cito.",
            soap_plan_sosial="Edukasi keluarga tentang persetujuan operasi cito."
        )
        
        db.add_all([log1, log2, log3])
        print("  -> Created Logbooks with SOAP contents")

        # 7. Create Assignments (Tugas)
        t_tugas1 = Tugas(
            student_id=koas.user_id,
            rotation_id=active_rot.rotation_id,
            title="Laporan Kasus Dengue Hemorrhagic Fever",
            description="Kaji kasus pasien DHF Grade II di bangsal Penyakit Dalam dengan analisis patofisiologi dan manajemen terapi.",
            due_date=date(2026, 10, 22),
            status="Belum Selesai"
        )
        
        t_tugas2 = Tugas(
            student_id=koas.user_id,
            rotation_id=active_rot.rotation_id,
            title="Pemaparan Jurnal: Terapi Kombinasi Hipertensi",
            description="Telaah jurnal klinis internasional mengenai perbandingan efikasi obat kombinasi ARB dan CCB.",
            due_date=date(2026, 10, 25),
            status="Menunggu Penilaian",
            submission_file="Jurnal_Andi_IPD.pdf",
            submitted_at=datetime(2026, 10, 15, 14, 30)
        )
        
        db.add_all([t_tugas1, t_tugas2])
        print("  -> Created Assignments")
        
        await db.commit()

    print("Seeding finished successfully! Database is ready to be used.")

if __name__ == "__main__":
    asyncio.run(seed())

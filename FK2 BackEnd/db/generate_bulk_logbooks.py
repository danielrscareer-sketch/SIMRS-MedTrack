import asyncio
import random
from datetime import date, timedelta
from sqlalchemy import select
from models.database import AsyncSessionLocal
from models.user import User
from models.stase import Stase, CompetencyTarget, CompetencyProgress
from models.rotation import Rotation
from models.logbook import Logbook

# Medical cases database for realistic SOAP generation
MEDICAL_CASES = [
    {
        "diagnosis": "Gastroenteritis Akut",
        "action": "Pemberian Rehidrasi Oral & Injeksi Antiemetik",
        "peran": "Mandiri",
        "triage": "Kuning (Urgent)",
        "skala_nyeri": "4",
        "soap_subjective_sekarang": "Diare cair > 5x sehari sejak kemarin, lemas, mual, dan muntah 2x. Demam sumeng (+).",
        "soap_subjective_dahulu": "Riwayat makan makanan pedas/sembarangan 2 hari lalu.",
        "soap_obj_keadaan_umum": "Sakit Sedang / Lemah",
        "soap_obj_kesadaran": "Compos Mentis",
        "soap_obj_td": "110/70",
        "soap_obj_nadi": "92",
        "soap_obj_rr": "18",
        "soap_obj_suhu": "37.8",
        "soap_obj_lainnya": "Abdomen: Bising usus meningkat (+), nyeri tekan epigastrium (+), turgor kulit kembali lambat (+).",
        "soap_asses_kerja": "Gastroenteritis Akut dengan Dehidrasi Ringan-Sedang.",
        "soap_plan_medikamentosa": "IVFD RL 20 tpm, Inj. Ondansetron 4mg/12j IV, Oralit 1 sachet tiap BAB, Zinc 1x20mg (10 hari).",
        "soap_plan_non_medikamentosa": "Diet lunak rendah serat, edukasi personal hygiene dan cuci tangan.",
        "soap_plan_sosial": "Edukasi pentingnya rehidrasi oral aktif di rumah."
    },
    {
        "diagnosis": "Diabetes Mellitus Tipe 2",
        "action": "Konseling Gizi & Edukasi Insulin Pen",
        "peran": "Mandiri",
        "triage": "Hijau (Non-Urgent)",
        "skala_nyeri": "0",
        "soap_subjective_sekarang": "Kontrol rutin poli penyakit dalam. Mengeluh sering kesemutan di kedua kaki, badan terasa sering lemas.",
        "soap_subjective_dahulu": "Riwayat DM tipe 2 sejak 3 tahun lalu, konsumsi Metformin 2x500mg tidak teratur.",
        "soap_obj_keadaan_umum": "Sakit Ringan",
        "soap_obj_kesadaran": "Compos Mentis",
        "soap_obj_td": "130/80",
        "soap_obj_nadi": "80",
        "soap_obj_rr": "16",
        "soap_obj_suhu": "36.5",
        "soap_obj_lainnya": "Gula Darah Sewaktu (GDS): 245 mg/dL. Sensorik kaki: Hipestesi tipe glove & stocking (+) minimal.",
        "soap_asses_kerja": "Diabetes Mellitus Tipe 2 uncontrolled dengan Neuropati Diabetik.",
        "soap_plan_medikamentosa": "Metformin 3x500mg PO, Glimepiride 1x2mg PO pagi, Vitamin B1 B6 B12 1x1 tab PO.",
        "soap_plan_non_medikamentosa": "Konseling diet DM 1700 kkal, edukasi perawatan kaki diabetik dan alas kaki longgar.",
        "soap_plan_sosial": "Edukasi kepatuhan minum obat seumur hidup guna menghindari komplikasi ginjal dan mata."
    },
    {
        "diagnosis": "Hipertensi Grade II",
        "action": "Edukasi Diet Rendah Garam & EKG Dasar",
        "peran": "Mandiri",
        "triage": "Hijau (Non-Urgent)",
        "skala_nyeri": "2",
        "soap_subjective_sekarang": "Mengeluh sakit kepala bagian belakang seperti kaku leher sejak 3 hari lalu. Berdebar-debar sesekali (+).",
        "soap_subjective_dahulu": "Riwayat hipertensi diketahui sejak 1 tahun lalu, jarang kontrol ke puskesmas.",
        "soap_obj_keadaan_umum": "Sakit Ringan",
        "soap_obj_kesadaran": "Compos Mentis",
        "soap_obj_td": "165/100",
        "soap_obj_nadi": "84",
        "soap_obj_rr": "18",
        "soap_obj_suhu": "36.2",
        "soap_obj_lainnya": "Funduskopi: Retinopati HT gr I (-). EKG: Sinus Ritme, LVH (-) voltase kriteria Cornell normal.",
        "soap_asses_kerja": "Hipertensi Esensial Grade II.",
        "soap_plan_medikamentosa": "Amlodipine 1x10mg PO malam, Candesartan 1x8mg PO pagi.",
        "soap_plan_non_medikamentosa": "Edukasi diet DASH (rendah garam, tinggi serat), batasi konsumsi kopi dan kelola stres.",
        "soap_plan_sosial": "Jadwalkan kontrol ulang 1 minggu untuk evaluasi TD."
    },
    {
        "diagnosis": "Asthma Bronchiale",
        "action": "Pemberian Nebulisasi & Terapi Oksigen",
        "peran": "Mandiri",
        "triage": "Kuning (Urgent)",
        "skala_nyeri": "3",
        "soap_subjective_sekarang": "Sesak napas berbunyi mengik (wheezing) sejak tadi malam setelah terpapar cuaca dingin dan debu.",
        "soap_subjective_dahulu": "Riwayat asma sejak masa kanak-kanak, kambuh 1-2x sebulan. Riwayat atopi keluarga (+).",
        "soap_obj_keadaan_umum": "Sakit Sedang / Dispnea Ringan",
        "soap_obj_kesadaran": "Compos Mentis",
        "soap_obj_td": "120/80",
        "soap_obj_nadi": "104",
        "soap_obj_rr": "26",
        "soap_obj_suhu": "36.6",
        "soap_obj_lainnya": "Pulmo: Suara napas vesikuler, Wheezing (+/+) ekspiratoar di seluruh lapang paru. SpO2 94% room air.",
        "soap_asses_kerja": "Asma Bronkial Eksaserbasi Akut Derajat Ringan-Sedang.",
        "soap_plan_medikamentosa": "Nebulisasi Combivent (Salbutamol+Ipratropium) 1 respul, O2 nasal kanul 3 lpm, Inj. Dexamethasone 5mg IV.",
        "soap_plan_non_medikamentosa": "Posisikan semi-fowler, observasi RR dan wheezing pasca-nebulisasi.",
        "soap_plan_sosial": "Edukasi menghindari allergen pencetus (debu, dingin, stres)."
    },
    {
        "diagnosis": "Pneumonia",
        "action": "Pengambilan Sputum & Terapi Oksigen",
        "peran": "Asistensi",
        "triage": "Kuning (Urgent)",
        "skala_nyeri": "4",
        "soap_subjective_sekarang": "Batuk berdahak kental warna kehijauan sejak 5 hari, demam tinggi naik turun (+), sesak napas bertambah saat aktivitas.",
        "soap_subjective_dahulu": "Riwayat merokok kronis, batuk lama sebelumnya (-).",
        "soap_obj_keadaan_umum": "Sakit Sedang / Lemah",
        "soap_obj_kesadaran": "Compos Mentis",
        "soap_obj_td": "110/80",
        "soap_obj_nadi": "98",
        "soap_obj_rr": "24",
        "soap_obj_suhu": "38.9",
        "soap_obj_lainnya": "Thorax: Inspeksi simetris, Palpasi fremitus taktil meningkat kanan dekstra, Auskultasi: Ronki basah kasar (+/+) paru dekstra.",
        "soap_asses_kerja": "Pneumonia Komunitas (CAP) derajat sedang.",
        "soap_plan_medikamentosa": "IVFD NaCl 0.9% 20 tpm, Inj. Ceftriaxone 2g/24j IV, Inj. Levofloxacin 750mg/24j IV, Paracetamol 3x500mg PO prn.",
        "soap_plan_non_medikamentosa": "Oksigen 3 lpm nasal kanul, postural drainage, fisioterapi dada.",
        "soap_plan_sosial": "Edukasi batuk efektif dan cara pengumpulan sputum yang benar."
    },
    {
        "diagnosis": "Dengue Hemorrhagic Fever",
        "action": "Rumple Leede Test & IV Line Access",
        "peran": "Mandiri",
        "triage": "Kuning (Urgent)",
        "skala_nyeri": "5",
        "soap_subjective_sekarang": "Demam tinggi mendadak terus menerus hari ke-5. Nyeri sendi dan otot hebat (breakbone fever), mimisan 1x hari ini.",
        "soap_subjective_dahulu": "Riwayat keluarga/lingkungan terkena demam berdarah (+).",
        "soap_obj_keadaan_umum": "Sakit Sedang / Lemah",
        "soap_obj_kesadaran": "Compos Mentis",
        "soap_obj_td": "100/70",
        "soap_obj_nadi": "90",
        "soap_obj_rr": "20",
        "soap_obj_suhu": "38.2",
        "soap_obj_lainnya": "Ptekie (+) di tangan, Rumple leede test (+). Lab: Trombosit 60.000 /uL, Hematokrit meningkat 15% dari baseline.",
        "soap_asses_kerja": "Dengue Hemorrhagic Fever (DHF) Grade I-II.",
        "soap_plan_medikamentosa": "IVFD RL 7 cc/kgBB/jam (pemeliharaan ketat), Paracetamol drip 1g IV (jika suhu > 38.5 C).",
        "soap_plan_non_medikamentosa": "Tirah baring total (bed rest), anjurkan banyak minum air/jus buah.",
        "soap_plan_sosial": "Pantau ketat tanda syok (akral dingin, gelisah, urin menurun), cek darah lengkap berkala tiap 12 jam."
    },
    {
        "diagnosis": "Typhoid Fever",
        "action": "Pemeriksaan Fisik Abdomen & Pengambilan Darah",
        "peran": "Mandiri",
        "triage": "Kuning (Urgent)",
        "skala_nyeri": "3",
        "soap_subjective_sekarang": "Demam naik turun terutama malam hari sejak 7 hari. Mengeluh konstipasi bergantian dengan diare, lidah terasa kotor.",
        "soap_subjective_dahulu": "Kebiasaan jajan sembarangan di luar rumah/warung pinggir jalan.",
        "soap_obj_keadaan_umum": "Sakit Sedang / Lemah",
        "soap_obj_kesadaran": "Apatis",
        "soap_obj_td": "110/70",
        "soap_obj_nadi": "78 (relatif bradikardi)",
        "soap_obj_rr": "18",
        "soap_obj_suhu": "39.0",
        "soap_obj_lainnya": "Mulut: Typhoid tongue (+), getaran tremor lidah (+). Abdomen: Hepatomegali ringan (+), nyeri tekan abdomen kuadran kanan atas.",
        "soap_asses_kerja": "Demam Tifoid dengan komplikasi ringan.",
        "soap_plan_medikamentosa": "Inj. Ceftriaxone 2g/24j IV (3-5 hari), Paracetamol PO 3x500mg, multivitamin PO 1x1.",
        "soap_plan_non_medikamentosa": "Diet bubur saring rendah serat/lunak, bed rest total, edukasi hygiene makanan.",
        "soap_plan_sosial": "Edukasi keluarga tentang tirah baring guna mencegah perforasi usus."
    }
]

COMMENTS = [
    "Anamnesis SOAP terstruktur dengan baik. Terapi medikamentosa tepat.",
    "Rencana edukasi non-medikamentosa sangat detail. Pertahankan kinerjamu!",
    "Pemeriksaan fisik ditulis dengan sangat baik. Terus tingkatkan kemampuan klinis.",
    "Bagus, SOAP sudah lengkap. Tindakan mandiri terdokumentasi dengan baik.",
    "Sangat informatif. Terapi rehidrasi dan pemantauan klinis pasien ditulis secara komprehensif."
]

async def generate_bulk_data(num_entries: int = 50):
    print(f"Synthesizing {num_entries} EMR SOAP entries into Neon DB...")
    async with AsyncSessionLocal() as db:
        # Get Student 'koas'
        res_koas = await db.execute(select(User).where(User.username == "koas"))
        koas = res_koas.scalar()
        if not koas:
            print("Error: User 'koas' not found! Run seed.py first.")
            return
        
        # Get active rotation
        res_rot = await db.execute(select(Rotation).where(
            Rotation.student_id == koas.user_id,
            Rotation.status == "Berjalan"
        ))
        active_rot = res_rot.scalar()
        if not active_rot:
            print("Error: Active rotation 'Berjalan' for koas not found!")
            return

        # Get Dosen/DPJP
        res_dos = await db.execute(select(User).where(User.role == "dosen"))
        dosen = res_dos.scalar()
        dosen_name = dosen.name if dosen else "Dr. Budi Santoso, Sp.PD"

        # Generate entries
        start_date = date.today() - timedelta(days=30)
        
        created_count = 0
        for i in range(num_entries):
            # Select random date in past 30 days
            log_date = start_date + timedelta(days=random.randint(0, 29))
            
            # Select random clinical case
            case = random.choice(MEDICAL_CASES)
            
            # Random status
            status = random.choices(["approved", "pending", "rejected"], weights=[70, 20, 10])[0]
            
            score = None
            comment = None
            rev_note = None
            
            if status == "approved":
                score = random.randint(80, 95)
                comment = random.choice(COMMENTS)
            elif status == "rejected":
                rev_note = f"Perbaiki bagian Plan (P) atau diagnosis banding untuk kasus {case['diagnosis']}."

            rm_number = f"RM-{random.randint(10000, 99999)}"

            # Create Logbook entry
            log = Logbook(
                student_id=koas.user_id,
                rotation_id=active_rot.rotation_id,
                date=log_date,
                rm=rm_number,
                diagnosis=case["diagnosis"],
                action=case["action"],
                peran=case["peran"],
                is_jaga_malam=random.choice([True, False]),
                dokter_spesialis=dosen_name if status == "approved" else "",
                dokter_unit=random.choice(["dr. Rian (Poli)", "dr. Sarah (IGD)", "dr. Joko (OK)", "dr. Lisa (Bangsal)"]),
                triage=case["triage"],
                skala_nyeri=case["skala_nyeri"],
                informed_consent="Telah Diberikan (Setuju)",
                lampiran="",
                status=status,
                score=score,
                comment=comment,
                revision_note=rev_note,
                
                soap_subjective_sekarang=case["soap_subjective_sekarang"],
                soap_subjective_dahulu=case["soap_subjective_dahulu"],
                soap_obj_keadaan_umum=case["soap_obj_keadaan_umum"],
                soap_obj_kesadaran=case["soap_obj_kesadaran"],
                soap_obj_td=case["soap_obj_td"],
                soap_obj_nadi=case["soap_obj_nadi"],
                soap_obj_rr=case["soap_obj_rr"],
                soap_obj_suhu=case["soap_obj_suhu"],
                soap_obj_lainnya=case["soap_obj_lainnya"],
                soap_asses_kerja=case["soap_asses_kerja"],
                soap_plan_medikamentosa=case["soap_plan_medikamentosa"],
                soap_plan_non_medikamentosa=case["soap_plan_non_medikamentosa"],
                soap_plan_sosial=case["soap_plan_sosial"]
            )
            
            db.add(log)
            created_count += 1

            # Auto-increment student progress if approved
            if status == "approved":
                # Find matching target
                res_target = await db.execute(select(CompetencyTarget).where(
                    CompetencyTarget.stase_id == active_rot.stase_id,
                    CompetencyTarget.case_name == case["diagnosis"]
                ))
                target = res_target.scalar()
                if target:
                    # Find progress
                    res_prog = await db.execute(select(CompetencyProgress).where(
                        CompetencyProgress.student_id == koas.user_id,
                        CompetencyProgress.target_id == target.target_id
                    ))
                    prog = res_prog.scalar()
                    if prog:
                        prog.achieved_count += 1
                    else:
                        new_prog = CompetencyProgress(
                            student_id=koas.user_id,
                            target_id=target.target_id,
                            achieved_count=1
                        )
                        db.add(new_prog)

        await db.commit()
        print(f"Successfully generated {created_count} medical records in Neon DB.")

if __name__ == "__main__":
    asyncio.run(generate_bulk_data(50))

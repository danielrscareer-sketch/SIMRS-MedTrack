-- ============================================================
-- SIMRS MedTrack — Database Schema
-- Compatible with PostgreSQL
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop old tables if they exist to start fresh
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;
DROP TABLE IF EXISTS malls CASCADE;
DROP TABLE IF EXISTS social_metrics CASCADE;
DROP TABLE IF EXISTS campaign_events CASCADE;
DROP MATERIALIZED VIEW IF EXISTS daily_revenue CASCADE;

DROP TABLE IF EXISTS tugas CASCADE;
DROP TABLE IF EXISTS logbooks CASCADE;
DROP TABLE IF EXISTS student_competency_progress CASCADE;
DROP TABLE IF EXISTS competency_targets CASCADE;
DROP TABLE IF EXISTS rotations CASCADE;
DROP TABLE IF EXISTS stases CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================
-- USERS & ACCOUNTS
-- ============================================================
CREATE TABLE users (
    user_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username      VARCHAR(100) NOT NULL UNIQUE,  -- NIM for Koas, NIP/Email for Dosen/Admin
    password_hash VARCHAR(255) NOT NULL,
    name          VARCHAR(255) NOT NULL,
    role          VARCHAR(50) NOT NULL CHECK (role IN ('mahasiswakoas', 'dosen', 'admin')),
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CLINICAL ROTATION STASES (DEPARTMENTS)
-- ============================================================
CREATE TABLE stases (
    stase_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name           VARCHAR(255) NOT NULL UNIQUE, -- e.g. "Ilmu Penyakit Dalam", "Ilmu Bedah"
    duration_weeks INTEGER NOT NULL DEFAULT 4,
    is_active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ROTATIONS (STUDENT SCHEDULING & PLOTTING)
-- ============================================================
CREATE TABLE rotations (
    rotation_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id         UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    stase_id           UUID NOT NULL REFERENCES stases(stase_id) ON DELETE CASCADE,
    hospital           VARCHAR(255) NOT NULL, -- e.g. "RSUP Dr. Sardjito", "RSUD Utama"
    supervisor_id      UUID REFERENCES users(user_id) ON DELETE SET NULL, -- Dokter Spesialis / DPJP
    start_date         DATE NOT NULL,
    end_date           DATE NOT NULL,
    status             VARCHAR(50) NOT NULL DEFAULT 'Berjalan' CHECK (status IN ('Berjalan', 'Selesai', 'Pending')),
    grade              VARCHAR(10) DEFAULT '-', -- Final grade (A, A-, B+, etc.)
    night_shifts_done  INTEGER NOT NULL DEFAULT 0,
    night_shifts_total INTEGER NOT NULL DEFAULT 5,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, stase_id, start_date)
);

-- ============================================================
-- CLINICAL COMPETENCY TARGETS
-- ============================================================
CREATE TABLE competency_targets (
    target_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stase_id     UUID NOT NULL REFERENCES stases(stase_id) ON DELETE CASCADE,
    case_name    VARCHAR(255) NOT NULL, -- e.g. "Dengue Hemorrhagic Fever"
    target_count INTEGER NOT NULL DEFAULT 1,
    level        VARCHAR(20) NOT NULL, -- e.g. "4A", "3B", "4"
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(stase_id, case_name)
);

-- ============================================================
-- STUDENT COMPETENCY PROGRESS (TARGET ACHIVED BY KOAS)
-- ============================================================
CREATE TABLE student_competency_progress (
    progress_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id     UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    target_id      UUID NOT NULL REFERENCES competency_targets(target_id) ON DELETE CASCADE,
    achieved_count INTEGER NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, target_id)
);

-- ============================================================
-- CLINICAL SOAP LOGBOOKS
-- ============================================================
CREATE TABLE logbooks (
    log_id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id                UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    rotation_id               UUID NOT NULL REFERENCES rotations(rotation_id) ON DELETE CASCADE,
    date                      DATE NOT NULL DEFAULT CURRENT_DATE,
    rm                        VARCHAR(50) NOT NULL, -- Rekam Medis number
    diagnosis                 VARCHAR(255) NOT NULL, -- Diagnosis name (e.g. DHF)
    action                    VARCHAR(255) NOT NULL, -- Action / Medical Procedure
    peran                     VARCHAR(50) NOT NULL CHECK (peran IN ('Mandiri', 'Asistensi', 'Observasi')),
    is_jaga_malam             BOOLEAN NOT NULL DEFAULT FALSE,
    dokter_spesialis          VARCHAR(255), -- DPJP
    dokter_unit               VARCHAR(255) NOT NULL, -- Doctor at ward/IGD
    dokter_konsul             VARCHAR(255),
    triage                    VARCHAR(100), -- Merah, Kuning, Hijau
    skala_nyeri               VARCHAR(20), -- skala 0-10
    informed_consent          VARCHAR(100), -- Telah Diberikan, Belum, dll
    lampiran                  VARCHAR(255), -- PDF or Image path/URL
    status                    VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    revision_note             TEXT,
    score                     INTEGER, -- 0-100 graded by supervisor
    comment                   TEXT, -- supervisor feedback comment
    
    -- SOAP Clinical Notes
    soap_subjective_sekarang  TEXT NOT NULL,
    soap_subjective_dahulu    TEXT,
    soap_obj_keadaan_umum     VARCHAR(255) NOT NULL,
    soap_obj_kesadaran        VARCHAR(100) NOT NULL,
    soap_obj_td               VARCHAR(50),
    soap_obj_nadi             VARCHAR(50),
    soap_obj_rr               VARCHAR(50),
    soap_obj_suhu             VARCHAR(50),
    soap_obj_lainnya          TEXT,
    soap_asses_kerja          VARCHAR(255) NOT NULL,
    soap_asses_banding        VARCHAR(255),
    soap_plan_medikamentosa   TEXT NOT NULL,
    soap_plan_non_medikamentosa TEXT,
    soap_plan_sosial          TEXT,
    
    created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ASSIGNMENTS & TASKS
-- ============================================================
CREATE TABLE tugas (
    tugas_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id      UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    rotation_id     UUID NOT NULL REFERENCES rotations(rotation_id) ON DELETE CASCADE,
    title           VARCHAR(255) NOT NULL, -- e.g. "Pemaparan Jurnal", "Laporan Kasus"
    description     TEXT,
    due_date        DATE NOT NULL,
    status          VARCHAR(50) NOT NULL DEFAULT 'Belum Selesai' CHECK (status IN ('Belum Selesai', 'Menunggu Penilaian', 'Selesai')),
    grade           VARCHAR(10) DEFAULT '-', -- A, B+, etc.
    score           INTEGER, -- 0-100
    comment         TEXT,
    submission_file VARCHAR(255), -- PDF file link
    submitted_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- HELPER & INDEXES
-- ============================================================
CREATE INDEX idx_rotations_student ON rotations (student_id);
CREATE INDEX idx_logbooks_student_status ON logbooks (student_id, status);
CREATE INDEX idx_logbooks_rotation ON logbooks (rotation_id);
CREATE INDEX idx_tugas_student ON tugas (student_id);

-- ============================================================
-- AUTO-UPDATE UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_stases_updated_at BEFORE UPDATE ON stases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_rotations_updated_at BEFORE UPDATE ON rotations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_competency_targets_updated_at BEFORE UPDATE ON competency_targets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_student_competency_progress_updated_at BEFORE UPDATE ON student_competency_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_logbooks_updated_at BEFORE UPDATE ON logbooks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_tugas_updated_at BEFORE UPDATE ON tugas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

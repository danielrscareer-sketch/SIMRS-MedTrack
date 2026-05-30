import React, { useState } from 'react';
import { Search, Filter, CheckCircle, XCircle, User, Calendar, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import './ValidasiLogbook.css';

const convertGrade = (scoreStr: string) => {
    const score = parseInt(scoreStr);
    if (isNaN(score)) return '-';
    if (score >= 85) return 'A';
    if (score >= 80) return 'A-';
    if (score >= 75) return 'B+';
    if (score >= 70) return 'B';
    if (score >= 65) return 'C+';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'E';
};

interface VerificationEntry {
    id: string;
    studentName: string;
    stase: string;
    date: string;
    diagnosis: string;
    action: string;
    rm: string;
    peran: string;
    soap: {
        subjectiveSekarang: string;
        subjectiveDahulu?: string;
        objKeadaanUmum: string;
        objKesadaran: string;
        objTD: string;
        objNadi: string;
        objRR: string;
        objSuhu: string;
        objLainnya: string;
        assesKerja: string;
        assesBanding?: string;
        planMedikamentosa: string;
        planNonMedikamentosa?: string;
        planSosial?: string;
    };
    kondisiPasien: string;
    isJagaMalam: boolean;
    dokterSpesialis: string;
    dokterUnit: string;
    dokterKonsul?: string;
    triage: string;
    skalaNyeri: string;
    informedConsent: string;
    lampiran?: string;
    status: 'pending' | 'approved' | 'rejected';
}

const DUMMY_ENTRIES: VerificationEntry[] = [
    { 
        id: 'V-101', studentName: 'Andi Saputra', stase: 'Ilmu Penyakit Dalam', date: 'Tindakan: 18 Okt 2026', diagnosis: 'DHF Grade II', action: 'Pemasangan IV Line', rm: 'RM-44919', peran: 'Mandiri', 
        kondisiPasien: 'Gawat Darurat', isJagaMalam: false, dokterSpesialis: 'Dr. Budi Santoso, Sp.PD', dokterUnit: 'Dr. Ahmad (Ruangan)', triage: 'Merah (Gawat Darurat)', skalaNyeri: '7', informedConsent: 'Telah Diberikan (Setuju)', lampiran: 'EKG_DHF_Andi.pdf',
        soap: {
            subjectiveSekarang: 'Demam tinggi 4 hari SMRS, mual, muntah 3x, lemas. Nyeri ulu hati (+).',
            subjectiveDahulu: 'Riwayat tifus 1 tahun lalu. Alergi obat (-).',
            objKeadaanUmum: 'Sakit Sedang / Lemah',
            objKesadaran: 'Compos Mentis',
            objTD: '90/60',
            objNadi: '110',
            objRR: '22',
            objSuhu: '38.5',
            objLainnya: 'Akral mulai dingin, CRT 3 detik. Ptekie (+) di kedua ekstremitas bawah. Trombosit 45.000, Ht 48%.',
            assesKerja: 'Dengue Hemorrhagic Fever (DHF) Grade II dengan impending shock (DSS).',
            assesBanding: 'Demam Tifoid, Leptospirosis',
            planMedikamentosa: 'Loading cairan RL 15-20 cc/kgBB. Paracetamol IV 1g prn demam.',
            planNonMedikamentosa: 'Pemasangan IV line 18G.',
            planSosial: 'Observasi ketat tanda vital dan produksi urin tiap jam. Edukasi keluarga mengenai kondisi gawat.'
        }, 
        status: 'pending' 
    },
    { 
        id: 'V-102', studentName: 'Budi Raharjo', stase: 'Ilmu Penyakit Dalam', date: 'Tindakan: 18 Okt 2026', diagnosis: 'STEMI Trombolitik', action: 'Interpretasi EKG', rm: 'RM-59912', peran: 'Asistensi', 
        kondisiPasien: 'Kritis', isJagaMalam: true, dokterSpesialis: '', dokterUnit: 'Dr. Ridwan (IGD)', dokterKonsul: 'Dr. Budi Santoso, Sp.PD (Telepon)', triage: 'Merah (Gawat Darurat)', skalaNyeri: '9', informedConsent: 'Telah Diberikan (Setuju)', lampiran: 'STEMI_V1_V6_Budi.png',
        soap: {
            subjectiveSekarang: 'Nyeri dada kiri khas ampek/tertindih beban berat sejak 2 jam SMRS, keringat dingin (+).',
            subjectiveDahulu: 'Hipertensi kronis tidak terkontrol. Merokok 1 bungkus/hari.',
            objKeadaanUmum: 'Tampak Kesakitan',
            objKesadaran: 'Compos Mentis',
            objTD: '140/90',
            objNadi: '88',
            objRR: '24',
            objSuhu: '36.8',
            objLainnya: 'EKG: ST Elevasi di V1-V6, I, aVL. Enzim jantung Troponin I (+).',
            assesKerja: 'STEMI Anterior Ekstensif akut parsial trombolisis.',
            planMedikamentosa: 'Mulai injeksi Fibrinolitik (Streptokinase) di ruang resusitasi. ISDN sublingual.',
            planNonMedikamentosa: 'Pemasangan EKG 12 Lead (Asistensi). O2 nasal kanul 3 lpm.',
            planSosial: 'Kolaborasi lapor DPJP. Edukasi keluarga mengenai komplikasi tindakan trombolitik.'
        }, 
        status: 'pending' 
    },
    { 
        id: 'V-103', studentName: 'Citra Kirana', stase: 'Ilmu Penyakit Dalam', date: 'Tindakan: 17 Okt 2026', diagnosis: 'Bronkopneumonia', action: 'Suction Lendir', rm: 'RM-99001', peran: 'Observasi', 
        kondisiPasien: 'Stabil', isJagaMalam: false, dokterSpesialis: 'Dr. Siti, Sp.A', dokterUnit: 'Dr. Indah (Bangsal)', triage: 'Kuning (Urgent)', skalaNyeri: '2', informedConsent: 'Belum / Tidak Perlu',
        soap: {
            subjectiveSekarang: 'Bibir anak tampak kebiruan, napas cepat dan grok-grok. Kesulitan menyusu.',
            objKeadaanUmum: 'Sesa Napas Ekstra',
            objKesadaran: 'Somnolen',
            objTD: '-',
            objNadi: '140',
            objRR: '55',
            objSuhu: '37.8',
            objLainnya: 'SpO2 88% room air. Retraksi sela iga (+). Auskultasi: Ronkhi basah kasar di kedua lapang paru.',
            assesKerja: 'Bronkopneumonia dengan gagal napas tipe 1',
            assesBanding: 'Bronkiolitis',
            planMedikamentosa: 'Nebulisasi.',
            planNonMedikamentosa: 'Observasi teknik suction mukus. Pemasangan O2 sesuai saturasi.',
            planSosial: 'Edukasi ibu pasien mengenai posisi menyusui yang aman dan tanda bahaya napas.'
        }, 
        status: 'pending' 
    },
];

const ValidasiLogbookModule: React.FC = () => {
    const [entries, setEntries] = useState<VerificationEntry[]>(DUMMY_ENTRIES);
    const [expandedIds, setExpandedIds] = useState<string[]>([]);
    const [gradingState, setGradingState] = useState<Record<string, { grade: string, comment: string }>>({});

    const toggleExpand = (id: string) => {
        setExpandedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleGradeChange = (id: string, field: 'grade' | 'comment', value: string) => {
        setGradingState(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [field]: value
            }
        }));
    };

    const handleAction = (id: string, newStatus: 'approved' | 'rejected') => {
        console.log(`Logbook ${id} marked as ${newStatus}`);
        setEntries(prev => prev.filter(entry => entry.id !== id));
        // Secara asinkronus notifikasi akan dikirim atau dimunculkan di UI
    };

    return (
        <div className="validasi-page animate-fade-in">
            <div className="validasi-header">
                <div className="header-text">
                    <h1 className="page-title">Validasi Buku Log Koas</h1>
                    <p className="page-subtitle">Setujui atau tolak laporan tindakan mahasiswa bimbingan Anda (Stase Penyakit Dalam).</p>
                </div>
                <div className="header-stats">
                    <div className="stat-box warning">
                        <h2>{entries.length}</h2>
                        <span>Menunggu</span>
                    </div>
                </div>
            </div>

            <div className="validasi-toolbar">
                <div className="search-bar">
                    <Search size={20} className="text-muted" />
                    <input type="text" placeholder="Cari nama mahasiswa atau diagnosis..." />
                </div>
                <button className="btn-filter">
                    <Filter size={18} /> Urutkan: Terlama
                </button>
            </div>

            <div className="validasi-list">
                {entries.length === 0 ? (
                    <div className="empty-validation-state">
                        <CheckCircle size={48} className="text-success mb-4" />
                        <h3>Semua Logbook Telah Tervalidasi</h3>
                        <p>Tidak ada antrean logbook Mahasiswa saat ini.</p>
                    </div>
                ) : (
                    entries.map(entry => {
                        const isExpanded = expandedIds.includes(entry.id);
                        const currentGrade = gradingState[entry.id]?.grade || '';
                        const currentComment = gradingState[entry.id]?.comment || '';

                        return (
                        <div key={entry.id} className={`validation-card ${isExpanded ? 'expanded' : 'hover-action'}`}>
                            {/* Header Section (Always Visible) */}
                            <div className="card-top" onClick={() => toggleExpand(entry.id)} style={{ cursor: 'pointer' }}>
                                <div className="student-profile">
                                    <div className="avatar-circle"><User size={20}/></div>
                                    <div>
                                        <h4>{entry.studentName}</h4>
                                        <span className="text-secondary text-sm">{entry.id} - {entry.stase}</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div className="date-badge">
                                        <Calendar size={14}/> {entry.date}
                                    </div>
                                    <button className="expand-btn">
                                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </button>
                                </div>
                            </div>

                            <div className="card-body">
                                <div className="detail-row">
                                    <span className="label">Diagnosis Kasus</span>
                                    <span className="value font-semibold">{entry.diagnosis}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Tindakan Medis</span>
                                    <span className="value text-accent font-semibold">{entry.action}</span>
                                </div>
                            </div>

                            {/* Expanded Medical Record Section */}
                            {isExpanded && (
                                <div className="expanded-content animate-fade-in">
                                    <div className="expanded-details-grid">
                                        <div className="ex-detail-item">
                                            <span className="ex-label">Nomor Rekam Medis</span>
                                            <span className="ex-value">{entry.rm}</span>
                                        </div>
                                        <div className="ex-detail-item">
                                            <span className="ex-label">Peran Koas</span>
                                            <span className="ex-value highlight-role">{entry.peran}</span>
                                        </div>
                                        <div className="ex-detail-item">
                                            <span className="ex-label">Kondisi Pasien</span>
                                            <span className="ex-value">{entry.kondisiPasien}</span>
                                        </div>
                                        <div className="ex-detail-item">
                                            <span className="ex-label">Triage</span>
                                            <span className="ex-value highlight-role" style={{ background: entry.triage.includes('Merah') ? '#FEE2E2' : entry.triage.includes('Kuning') ? '#FEF3C7' : '#D1FAE5', color: entry.triage.includes('Merah') ? '#EF4444' : entry.triage.includes('Kuning') ? '#F59E0B' : '#10B981' }}>{entry.triage}</span>
                                        </div>
                                        <div className="ex-detail-item">
                                            <span className="ex-label">VAS (Nyeri)</span>
                                            <span className="ex-value">{entry.skalaNyeri} / 10</span>
                                        </div>
                                        <div className="ex-detail-item">
                                            <span className="ex-label">Informed Consent</span>
                                            <span className="ex-value">{entry.informedConsent}</span>
                                        </div>
                                        {entry.lampiran ? (
                                            <div className="ex-detail-item" style={{ background: 'rgba(35, 64, 142, 0.05)', border: '1px solid rgba(35,64,142,0.1)' }}>
                                                <span className="ex-label">Berkas Lampiran</span>
                                                <button 
                                                    className="btn-secondary" 
                                                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', marginTop: '0.25rem', justifyContent: 'center' }}
                                                    onClick={(e) => { e.stopPropagation(); alert(`Membuka lampiran: ${entry.lampiran}`); }}
                                                >
                                                    <FileText size={14} /> Lihat Berkas / Lab
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="ex-detail-item">
                                                <span className="ex-label">Berkas Lampiran</span>
                                                <span className="ex-value" style={{ color: 'var(--text-muted)' }}>Tidak ada lampiran</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Medical Supervisor Block */}
                                    <div className="ex-supervisor-box" style={{ background: entry.isJagaMalam ? 'rgba(245, 158, 11, 0.05)' : 'rgba(35, 64, 142, 0.05)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', border: `1px solid ${entry.isJagaMalam ? 'rgba(245, 158, 11, 0.2)' : 'rgba(35, 64, 142, 0.1)'}` }}>
                                        <h5 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: entry.isJagaMalam ? '#B45309' : 'var(--primary)', fontSize: '0.9rem' }}>
                                            <User size={16}/> {entry.isJagaMalam ? 'Pengawas (Dinas Jaga Malam / Cito)' : 'Pengawas (Reguler / Jam Kerja)'}
                                        </h5>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                                            <div>
                                                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.2rem' }}>Dokter Spesialis (DPJP)</span>
                                                <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{entry.dokterSpesialis || '-'}</strong>
                                            </div>
                                            <div>
                                                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.2rem' }}>Dokter Unit / IGD</span>
                                                <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{entry.dokterUnit || '-'}</strong>
                                            </div>
                                            <div>
                                                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.2rem' }}>Konsul / Residen</span>
                                                <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{entry.dokterKonsul || '-'}</strong>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="ex-soap-box">
                                        <h5 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--primary)' }}>
                                            <FileText size={16}/> Catatan S-O-A-P Klinis
                                        </h5>
                                        <div className="soap-grid">
                                            {/* S - Subjective */}
                                            <div className="soap-item">
                                                <span className="soap-badge s">S</span>
                                                <div className="soap-content">
                                                    <strong>Subjective</strong>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                                                        <div>
                                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Rincian Sekarang:</span>
                                                            <p style={{ marginTop: '0.2rem' }}>{entry.soap.subjectiveSekarang}</p>
                                                        </div>
                                                        <div>
                                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Rincian Dahulu:</span>
                                                            <p style={{ marginTop: '0.2rem' }}>{entry.soap.subjectiveDahulu || '-'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* O - Objective */}
                                            <div className="soap-item">
                                                <span className="soap-badge o">O</span>
                                                <div className="soap-content" style={{ width: '100%' }}>
                                                    <strong>Objective</strong>
                                                    <div style={{ background: 'var(--surface)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--surface-border)', margin: '0.5rem 0' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', borderBottom: '1px solid var(--surface-border)', paddingBottom: '0.5rem' }}>
                                                            <div>
                                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'block' }}>Keadaan Umum:</span>
                                                                <span style={{ fontWeight: 600 }}>{entry.soap.objKeadaanUmum}</span>
                                                            </div>
                                                            <div style={{ textAlign: 'right' }}>
                                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'block' }}>Kesadaran:</span>
                                                                <span style={{ fontWeight: 600 }}>{entry.soap.objKesadaran}</span>
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
                                                            <div><span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'block' }}>TD</span><span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{entry.soap.objTD}</span></div>
                                                            <div><span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'block' }}>Nadi</span><span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{entry.soap.objNadi}</span></div>
                                                            <div><span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'block' }}>RR</span><span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{entry.soap.objRR}</span></div>
                                                            <div><span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'block' }}>Suhu</span><span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{entry.soap.objSuhu}°C</span></div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Pemeriksaan Fisik/Penunjang Lainnya:</span>
                                                        <p style={{ marginTop: '0.2rem' }}>{entry.soap.objLainnya}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* A - Assessment */}
                                            <div className="soap-item">
                                                <span className="soap-badge a">A</span>
                                                <div className="soap-content">
                                                    <strong>Assessment</strong>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                                                        <div>
                                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Diagnosis Kerja:</span>
                                                            <p style={{ marginTop: '0.2rem', fontWeight: 600 }}>{entry.soap.assesKerja}</p>
                                                        </div>
                                                        <div>
                                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Diagnosis Banding:</span>
                                                            <p style={{ marginTop: '0.2rem' }}>{entry.soap.assesBanding || '-'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* P - Plan */}
                                            <div className="soap-item">
                                                <span className="soap-badge p">P</span>
                                                <div className="soap-content" style={{ width: '100%' }}>
                                                    <strong>Plan</strong>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                                                        <div style={{ background: '#F0FDFA', padding: '0.5rem 0.75rem', borderRadius: '6px', borderLeft: '3px solid #10B981' }}>
                                                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#047857', display: 'block', marginBottom: '0.1rem' }}>Tatalaksana Medikamentosa:</span>
                                                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#064E3B' }}>{entry.soap.planMedikamentosa}</p>
                                                        </div>
                                                        {(entry.soap.planNonMedikamentosa) && (
                                                            <div style={{ background: '#EFF6FF', padding: '0.5rem 0.75rem', borderRadius: '6px', borderLeft: '3px solid #3B82F6' }}>
                                                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1D4ED8', display: 'block', marginBottom: '0.1rem' }}>Tatalaksana Non-Medikamentosa/Operatif:</span>
                                                                <p style={{ margin: 0, fontSize: '0.9rem', color: '#1E3A8A' }}>{entry.soap.planNonMedikamentosa}</p>
                                                            </div>
                                                        )}
                                                        {(entry.soap.planSosial) && (
                                                            <div style={{ background: '#FEF3C7', padding: '0.5rem 0.75rem', borderRadius: '6px', borderLeft: '3px solid #F59E0B' }}>
                                                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#B45309', display: 'block', marginBottom: '0.1rem' }}>Tatalaksana Sosial/Edukasi:</span>
                                                                <p style={{ margin: 0, fontSize: '0.9rem', color: '#78350F' }}>{entry.soap.planSosial}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Grading Section */}
                                    <div className="grading-section">
                                        <div className="grade-input-group" style={{ flex: '0.8' }}>
                                            <label>Input Nilai (0-100)</label>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <input 
                                                    type="number" 
                                                    min="0" max="100" 
                                                    placeholder="Contoh: 85" 
                                                    style={{ width: '80px', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--surface-border)', fontWeight: 'bold' }}
                                                    value={currentGrade} 
                                                    onChange={(e) => handleGradeChange(entry.id, 'grade', e.target.value)}
                                                />
                                                {currentGrade && (
                                                    <span style={{ 
                                                        fontSize: '1.2rem', fontWeight: 900, 
                                                        background: 'var(--surface-hover)', 
                                                        padding: '0.4rem 0.8rem', borderRadius: '8px',
                                                        color: 'var(--primary)',
                                                        minWidth: '45px', textAlign: 'center'
                                                    }}>
                                                        {convertGrade(currentGrade)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="comment-input-group">
                                            <label>Komentar Supervisor (Opsional)</label>
                                            <input 
                                                type="text" 
                                                placeholder="Berikan umpan balik atas tindakan mahasiswa..." 
                                                value={currentComment}
                                                onChange={(e) => handleGradeChange(entry.id, 'comment', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Actions Footer */}
                            <div className="card-actions">
                                <button className="btn-reject" onClick={(e) => { e.stopPropagation(); handleAction(entry.id, 'rejected'); }}>
                                    <XCircle size={18}/> {isExpanded ? 'Tolak & Kembalikan Revisi' : 'Tolak'}
                                </button>
                                <button 
                                    className="btn-approve" 
                                    onClick={(e) => { e.stopPropagation(); handleAction(entry.id, 'approved'); }}
                                    disabled={isExpanded && !currentGrade}
                                    title={isExpanded && !currentGrade ? 'Pilih nilai terlebih dahulu' : 'Verifikasi'}
                                >
                                    <CheckCircle size={18}/> {isExpanded ? 'Verifikasi Tindakan' : 'Setujui Secara Cepat'}
                                </button>
                            </div>
                        </div>
                    );
                })
                )}
            </div>
        </div>
    );
};

export default ValidasiLogbookModule;

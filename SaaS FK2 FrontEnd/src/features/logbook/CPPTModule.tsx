import React, { useState } from 'react';
import { Activity, Search, Filter, User, Calendar, Plus, CheckCircle, X } from 'lucide-react';
import './CPPTModule.css';

interface CPPTRecord {
    id: string;
    tanggal: string;
    waktu: string;
    penulis: string;
    role: string;
    pasienNama: string;
    pasienRM: string;
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
    verified: boolean;
}

const INITIAL_CPPT: CPPTRecord[] = [
    {
        id: 'CPPT-001',
        tanggal: '15 Okt 2026', waktu: '14:00',
        penulis: 'Andi Saputra', role: 'Koas',
        pasienNama: 'Tn. Budi Wijaya', pasienRM: 'RM-44919',
        subjective: 'Pasien merasa lebih segar, mual berkurang, demam turun sejak pagi.',
        objective: 'TD: 110/70 mmHg, HR: 84 x/mnt, T: 36.8°C, RR: 20 x/mnt. Akral hangat.',
        assessment: 'Dengue Fever H-4 (Fase Penyembuhan)',
        plan: '1. Teruskan IVFD RL 20 tpm\n2. Paracetamol k/p\n3. Cek DL ulang besok pagi',
        verified: false
    },
    {
        id: 'CPPT-002',
        tanggal: '15 Okt 2026', waktu: '08:00',
        penulis: 'Dr. Budi Santoso, Sp.PD', role: 'DPJP',
        pasienNama: 'Tn. Budi Wijaya', pasienRM: 'RM-44919',
        subjective: 'Demam hari ke-4, mual (+), pusing (+)',
        objective: 'TD: 120/80 mmHg, HR: 88 x/mnt, T: 37.5°C, Rumple Leede (+).',
        assessment: 'Dengue Fever H-4',
        plan: '1. IVFD RL 20 tpm\n2. Paracetamol 3x500mg\n3. Observasi ketat tanda perdarahan',
        verified: true
    }
];

const CPPTModule: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [records, setRecords] = useState<CPPTRecord[]>(INITIAL_CPPT);
    const [showForm, setShowForm] = useState(false);
    
    // Form state
    const [formData, setFormData] = useState({
        pasienNama: '', pasienRM: '',
        subjective: '', objective: '', assessment: '', plan: ''
    });

    const userRole = localStorage.getItem('userRole') || 'mahasiswakoas';
    const isKoas = userRole === 'mahasiswakoas';
    const isDosen = userRole === 'dosen';

    const filtered = records.filter(c => 
        c.pasienNama.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.pasienRM.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.subjective.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleVerify = (id: string) => {
        setRecords(prev => prev.map(rec => rec.id === id ? { ...rec, verified: true } : rec));
    };

    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const now = new Date();
        const newRecord: CPPTRecord = {
            id: `CPPT-${Math.floor(Math.random() * 1000)}`,
            tanggal: `${now.getDate()} Okt 2026`,
            waktu: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
            penulis: isKoas ? 'Andi Saputra (Koas)' : 'Pengguna',
            role: isKoas ? 'Koas' : 'Staff',
            pasienNama: formData.pasienNama,
            pasienRM: formData.pasienRM,
            subjective: formData.subjective,
            objective: formData.objective,
            assessment: formData.assessment,
            plan: formData.plan,
            verified: false
        };

        setRecords([newRecord, ...records]);
        setShowForm(false);
        setFormData({ pasienNama: '', pasienRM: '', subjective: '', objective: '', assessment: '', plan: '' });
    };

    return (
        <div className="cppt-module animate-fade-in">
            <header className="cppt-header">
                <div>
                    <h1 className="page-title"><Activity size={28} style={{ display: 'inline', marginRight: '0.5rem', color: 'var(--primary)' }}/> E-CPPT (Rekam Medis)</h1>
                    <p className="page-subtitle">Catatan Perkembangan Pasien Terintegrasi dengan metode S-O-A-P.</p>
                </div>
                {(isKoas || isDosen) && (
                    <button className="btn-primary" onClick={() => setShowForm(true)}>
                        <Plus size={18} /> Tambah CPPT
                    </button>
                )}
            </header>

            <div className="cppt-toolbar">
                <div className="search-bar" style={{ flex: 1 }}>
                    <Search size={18} color="var(--text-secondary)" />
                    <input 
                        type="text" 
                        placeholder="Cari Nama Pasien, No RM, atau Keluhan..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="btn-secondary">
                    <Filter size={18} /> Filter Tanggal
                </button>
            </div>

            {/* Inline Form CPPT */}
            {showForm && (
                <div className="cppt-card animate-slide-up" style={{ marginBottom: '2rem', border: '2px solid var(--primary)' }}>
                    <div className="cppt-card-header" style={{ borderBottom: 'none', paddingBottom: '0' }}>
                        <h2>Tambah Catatan CPPT Baru</h2>
                        <button className="icon-btn" onClick={() => setShowForm(false)}><X size={24}/></button>
                    </div>
                    <form onSubmit={handleAddSubmit} style={{ marginTop: '1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Nama Pasien</label>
                                <input type="text" className="input-field" required value={formData.pasienNama} onChange={e => setFormData({...formData, pasienNama: e.target.value})} placeholder="Cth: Tn. Budi Wijaya" />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Nomor Rekam Medis (RM)</label>
                                <input type="text" className="input-field" required value={formData.pasienRM} onChange={e => setFormData({...formData, pasienRM: e.target.value})} placeholder="Cth: RM-44919" />
                            </div>
                        </div>
                        
                        <h4 style={{ margin: '1.5rem 0 0.5rem', color: 'var(--primary)' }}>Catatan Klinis (S-O-A-P)</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}><strong style={{color: '#EAB308'}}>S</strong>ubjective (Keluhan Utama)</label>
                                <textarea className="input-field" required rows={2} value={formData.subjective} onChange={e => setFormData({...formData, subjective: e.target.value})} placeholder="Keluhan yang dirasakan pasien saat ini..."></textarea>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}><strong style={{color: '#3B82F6'}}>O</strong>bjective (Hasil Pemeriksaan)</label>
                                <textarea className="input-field" required rows={2} value={formData.objective} onChange={e => setFormData({...formData, objective: e.target.value})} placeholder="TTV (TD, Nadi, Suhu, RR) dan pemeriksaan fisik lainnya..."></textarea>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}><strong style={{color: '#EF4444'}}>A</strong>ssessment (Diagnosis/Kesimpulan)</label>
                                <textarea className="input-field" required rows={2} value={formData.assessment} onChange={e => setFormData({...formData, assessment: e.target.value})} placeholder="Diagnosis kerja atau masalah medis pasien..."></textarea>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}><strong style={{color: '#10B981'}}>P</strong>lan (Tatalaksana/Rencana)</label>
                                <textarea className="input-field" required rows={3} value={formData.plan} onChange={e => setFormData({...formData, plan: e.target.value})} placeholder="Rencana terapi, obat, maupun tindakan selanjutnya..."></textarea>
                            </div>
                        </div>

                        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Batal</button>
                            <button type="submit" className="btn-primary">Simpan ke Timeline</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="timeline-wrapper">
                {filtered.map(record => (
                    <div key={record.id} className={`cppt-card animate-slide-up ${!record.verified ? 'unverified' : ''}`}>
                        <div className="cppt-dot"></div>
                        
                        <div className="cppt-card-header">
                            <div className="cppt-patient-info">
                                <span className="cppt-patient-name">{record.pasienNama}</span>
                                <span className="cppt-patient-rm">{record.pasienRM}</span>
                            </div>
                            <div className="cppt-meta">
                                <span style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                                    <Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                    {record.tanggal} - {record.waktu}
                                </span>
                                <span>
                                    <User size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                    {record.penulis} ({record.role})
                                </span>
                                {record.verified ? (
                                    <span style={{ color: 'var(--success)', fontSize: '0.8rem', marginTop: '4px', fontWeight: 'bold' }}>✓ Diverifikasi DPJP</span>
                                ) : (
                                    <span style={{ color: 'var(--warning)', fontSize: '0.8rem', marginTop: '4px', fontWeight: 'bold' }}>Menunggu Verifikasi</span>
                                )}
                            </div>
                        </div>

                        <div className="cppt-soap-grid">
                            <div className="soap-section">
                                <span className="soap-tag tag-s">S (Subjective)</span>
                                <div className="soap-content">{record.subjective}</div>
                            </div>
                            <div className="soap-section">
                                <span className="soap-tag tag-o">O (Objective)</span>
                                <div className="soap-content">{record.objective}</div>
                            </div>
                            <div className="soap-section">
                                <span className="soap-tag tag-a">A (Assessment)</span>
                                <div className="soap-content">{record.assessment}</div>
                            </div>
                            <div className="soap-section">
                                <span className="soap-tag tag-p">P (Plan)</span>
                                <div className="soap-content" style={{ whiteSpace: 'pre-line' }}>{record.plan}</div>
                            </div>
                        </div>

                        {/* Dosen Verification Action */}
                        {isDosen && !record.verified && (
                            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
                                <button className="btn-primary" onClick={() => handleVerify(record.id)}>
                                    <CheckCircle size={18} /> Verifikasi Catatan Ini
                                </button>
                            </div>
                        )}
                    </div>
                ))}

                {filtered.length === 0 && (
                    <div className="empty-state" style={{ textAlign: 'center', padding: '3rem' }}>
                        <p style={{ color: 'var(--text-secondary)' }}>Tidak ada data CPPT yang sesuai pencarian.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CPPTModule;

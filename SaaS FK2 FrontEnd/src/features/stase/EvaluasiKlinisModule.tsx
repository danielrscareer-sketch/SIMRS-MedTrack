import React, { useState } from 'react';
import { Send, User, CheckCircle, Clock, XCircle, FileSignature, BookOpen, AlertCircle } from 'lucide-react';
import './EvaluasiKlinisModule.css';

interface HistoryItem {
    id: string;
    type: string;
    dosen: string;
    tanggal: string;
    status: 'pending' | 'approved' | 'rejected';
    note?: string;
}

const MOCK_HISTORY: HistoryItem[] = [
    { id: '1', type: 'Mini-CEX', dosen: 'Dr. Budi Santoso, Sp.PD', tanggal: '15 Okt 2026', status: 'pending' },
    { id: '2', type: 'DOPS', dosen: 'Dr. Herman, Sp.B', tanggal: '10 Okt 2026', status: 'rejected', note: 'Perbaiki laporan operasi' },
    { id: '3', type: 'CBD', dosen: 'Dr. Siti, Sp.A', tanggal: '05 Okt 2026', status: 'approved', note: 'Diskusi kasus pneumonia sangat baik' }
];

const EvaluasiKlinisModule: React.FC = () => {
    const [evalType, setEvalType] = useState('Mini-CEX');
    const [dosen, setDosen] = useState('');
    const [catatan, setCatatan] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 3000);
    };

    return (
        <div className="evaluasi-klinis-module animate-fade-in">
            <header className="evaluasi-header">
                <div>
                    <h1 className="page-title"><FileSignature size={28} style={{ display: 'inline', marginRight: '0.5rem', color: 'var(--primary)' }}/> Permintaan Evaluasi Klinis</h1>
                    <p className="page-subtitle">Ajukan penilaian Mini-CEX, DOPS, atau CBD langsung ke DPJP / Dosen Pembimbing.</p>
                </div>
            </header>

            <div className="eval-layout">
                {/* Kiri: Form Pengajuan */}
                <div className="eval-card animate-slide-up">
                    <h3><Send size={20} /> Ajukan Permintaan Baru</h3>
                    
                    {submitted ? (
                        <div className="success-state" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                            <CheckCircle size={48} color="var(--success)" style={{ margin: '0 auto 1rem' }} />
                            <h4>Permintaan Berhasil Terkirim!</h4>
                            <p style={{ color: 'var(--text-secondary)' }}>Dosen pembimbing akan menerima notifikasi ini.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="eval-form">
                            <div className="form-group">
                                <label>Jenis Evaluasi</label>
                                <select className="custom-input" value={evalType} onChange={e => setEvalType(e.target.value)}>
                                    <option value="Mini-CEX">Mini-CEX (Clinical Evaluation Exercise)</option>
                                    <option value="DOPS">DOPS (Direct Observation of Procedural Skills)</option>
                                    <option value="CBD">CBD (Case-Based Discussion)</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Dosen Penguji / DPJP</label>
                                <select className="custom-input" value={dosen} onChange={e => setDosen(e.target.value)} required>
                                    <option value="">- Pilih Dosen Spesialis -</option>
                                    <option value="Dr. Budi Santoso, Sp.PD">Dr. Budi Santoso, Sp.PD</option>
                                    <option value="Dr. Siti, Sp.A">Dr. Siti, Sp.A</option>
                                    <option value="Dr. Herman, Sp.B">Dr. Herman, Sp.B</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Catatan / Ringkasan Kasus Singkat</label>
                                <textarea 
                                    className="custom-input" 
                                    rows={4} 
                                    placeholder="Contoh: Pasien Tn. A dengan susp. Demam Berdarah Dengue hari ke-3, mohon diuji Mini-CEX pada saat visite pagi..."
                                    value={catatan}
                                    onChange={e => setCatatan(e.target.value)}
                                    required
                                />
                            </div>
                            
                            <div style={{ background: 'rgba(56, 83, 153, 0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
                                <AlertCircle size={20} color="var(--primary)" style={{ flexShrink: 0 }} />
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    Pastikan Anda sudah menginformasikan secara verbal kepada Dosen sebelum mengirimkan permintaan di sistem ini.
                                </span>
                            </div>

                            <button type="submit" className="btn-primary" style={{width: '100%', marginTop: '1rem'}}>
                                <Send size={18} /> Kirim Permintaan Evaluasi
                            </button>
                        </form>
                    )}
                </div>

                {/* Kanan: Riwayat Status */}
                <div className="eval-card animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <h3><BookOpen size={20} /> Riwayat Evaluasi Saya</h3>
                    
                    <div className="eval-history-list">
                        {MOCK_HISTORY.map(item => (
                            <div key={item.id} className="history-item">
                                <div className="history-item-header">
                                    <span className="history-type">{item.type}</span>
                                    <span className={`eval-badge badge-${item.status}`}>
                                        {item.status === 'pending' && 'Menunggu'}
                                        {item.status === 'approved' && 'Diterima & Dinilai'}
                                        {item.status === 'rejected' && 'Ditolak / Revisi'}
                                    </span>
                                </div>
                                <div className="history-dosen">
                                    <User size={14} /> {item.dosen}
                                    <span style={{ margin: '0 0.5rem', color: 'var(--border-color)' }}>|</span>
                                    <Clock size={14} /> {item.tanggal}
                                </div>
                                {item.note && (
                                    <div className="history-note">
                                        "{item.note}"
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EvaluasiKlinisModule;
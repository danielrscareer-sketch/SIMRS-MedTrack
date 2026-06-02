import React from 'react';
import { Users, CheckSquare, Calendar, BookOpen, MessageCircle, Video, Search, Plus } from 'lucide-react';
import './ModulBimbingan.css';

const ModulBimbingan: React.FC = () => {
    return (
        <div className="modul-bimbingan animate-fade-in">
            <header className="bimbingan-header">
                <div>
                    <h1 className="page-title"><Users size={28} style={{ display: 'inline', marginRight: '0.5rem', color: 'var(--primary)' }}/> Mahasiswa Bimbingan</h1>
                    <p className="page-subtitle">Pantau aktivitas koas, jadwalkan bimbingan, dan tinjau E-CPPT mereka.</p>
                </div>
            </header>

            <div className="bimbingan-metrics animate-slide-up">
                <div className="metric-card">
                    <div className="metric-icon" style={{ backgroundColor: 'rgba(237, 27, 36, 0.1)', color: 'var(--accent)' }}>
                        <CheckSquare size={24} />
                    </div>
                    <div className="metric-info">
                        <h4>Menunggu Validasi</h4>
                        <p>12 Log</p>
                    </div>
                </div>
                <div className="metric-card">
                    <div className="metric-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
                        <Users size={24} />
                    </div>
                    <div className="metric-info">
                        <h4>Koas Aktif</h4>
                        <p>8 Mhs</p>
                    </div>
                </div>
                <div className="metric-card">
                    <div className="metric-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>
                        <Calendar size={24} />
                    </div>
                    <div className="metric-info">
                        <h4>Bimbingan Minggu Ini</h4>
                        <p>3 Sesi</p>
                    </div>
                </div>
            </div>

            <div className="bimbingan-layout">
                {/* Kiri: Daftar Mahasiswa */}
                <div className="bimbingan-panel animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0 }}><BookOpen size={20} /> Daftar Koas Bimbingan</h3>
                        <div className="search-bar" style={{ width: '200px' }}>
                            <Search size={16} color="var(--text-secondary)" />
                            <input type="text" placeholder="Cari nama..." style={{ padding: '0.4rem', border: 'none', background: 'transparent', outline: 'none' }} />
                        </div>
                    </div>
                    
                    <div className="student-list">
                        <div className="student-item">
                            <div className="student-info">
                                <div className="student-avatar">AS</div>
                                <div className="student-details">
                                    <h4>Andi Saputra</h4>
                                    <p>Stase Ilmu Penyakit Dalam • Minggu ke-2</p>
                                </div>
                            </div>
                            <div className="student-actions">
                                <button className="action-btn" title="Kirim Pesan"><MessageCircle size={18} /></button>
                                <button className="action-btn" title="Jadwalkan Tele-Bimbingan"><Video size={18} /></button>
                                <button className="action-btn" title="Lihat E-CPPT"><ActivityIcon /></button>
                            </div>
                        </div>
                        <div className="student-item">
                            <div className="student-info">
                                <div className="student-avatar">BN</div>
                                <div className="student-details">
                                    <h4>Budi Nugroho</h4>
                                    <p>Stase Ilmu Penyakit Dalam • Minggu ke-2</p>
                                </div>
                            </div>
                            <div className="student-actions">
                                <button className="action-btn" title="Kirim Pesan"><MessageCircle size={18} /></button>
                                <button className="action-btn" title="Jadwalkan Tele-Bimbingan"><Video size={18} /></button>
                                <button className="action-btn" title="Lihat E-CPPT"><ActivityIcon /></button>
                            </div>
                        </div>
                        <div className="student-item">
                            <div className="student-info">
                                <div className="student-avatar" style={{ backgroundColor: '#fee2e2', color: '#ef4444' }}>CL</div>
                                <div className="student-details">
                                    <h4>Citra Lestari</h4>
                                    <p>Stase Ilmu Bedah • Minggu ke-1 <span style={{ color: '#ef4444', fontSize: '0.8rem', marginLeft: '0.5rem', fontWeight: 600 }}>Tugas Tertunda</span></p>
                                </div>
                            </div>
                            <div className="student-actions">
                                <button className="action-btn" title="Kirim Pesan"><MessageCircle size={18} /></button>
                                <button className="action-btn" title="Jadwalkan Tele-Bimbingan"><Video size={18} /></button>
                                <button className="action-btn" title="Lihat E-CPPT"><ActivityIcon /></button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Kanan: Jadwal & Notifikasi */}
                <div className="bimbingan-panel animate-slide-up" style={{ animationDelay: '0.2s' }}>
                    <h3><Calendar size={20} /> Jadwal Terdekat</h3>
                    <div className="upcoming-meetings">
                        <div className="meeting-item">
                            <div className="meeting-time">Besok, 14:00 WIB</div>
                            <div className="meeting-title">Presentasi Kasus (Mini-CEX)</div>
                            <div className="meeting-type">Bersama: Andi Saputra</div>
                        </div>
                        <div className="meeting-item" style={{ borderLeftColor: '#3B82F6', backgroundColor: 'rgba(59, 130, 246, 0.05)' }}>
                            <div className="meeting-time" style={{ color: '#3B82F6' }}>Kamis, 10:00 WIB</div>
                            <div className="meeting-title">Bimbingan Jurnal Reading</div>
                            <div className="meeting-type">Via Zoom Meeting</div>
                        </div>
                    </div>
                    
                    <button className="btn-secondary" style={{ width: '100%', marginTop: '1.5rem' }}>
                        <Plus size={18} /> Buat Jadwal Baru
                    </button>
                </div>
            </div>
        </div>
    );
};

// Helper component since Activity is imported in other places but we want to use it locally safely
const ActivityIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
    </svg>
);

export default ModulBimbingan;
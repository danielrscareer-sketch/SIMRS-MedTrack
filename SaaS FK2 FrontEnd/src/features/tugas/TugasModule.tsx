import React, { useState } from 'react';
import { FileText, CheckCircle, Clock, Upload, UserCheck, AlertCircle } from 'lucide-react';
import './TugasModule.css';

type TabState = 'ilmiah' | 'evaluasi';

const TugasModule: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabState>('ilmiah');
    
    // Tab tugas ilmiah (Makalah, Referat, Journal Reading)
    const tugasIlmiah = [
        { id: 1, type: 'Journal Reading', title: 'Manajemen Resusitasi Cairan pada DHF', supervisor: 'dr. Budi, Sp.PD', status: 'approved', date: 'Telah Maju: 15 Okt 2026', grade: 'A' },
        { id: 2, type: 'Laporan Kasus', title: 'STEMI Trombolitik Berhasil Pasca 1 Jam', supervisor: 'dr. Budi, Sp.PD', status: 'pending', date: 'Jadwal Maju: 22 Okt 2026', grade: '-' },
        { id: 3, type: 'Referat', title: 'Belum diunggah', supervisor: '-', status: 'empty', date: 'Deadline: 28 Okt 2026', grade: '-' },
    ];

    // Tab evaluasi (Mini-CEX, DOPS)
    const evaluasiKlinis = [
        { id: 1, type: 'Mini-CEX 1', title: 'Anamnesis & Pemeriksaan Fisik Kardiovaskular', supervisor: 'dr. Bambang, Sp.JP', status: 'approved', date: 'Diujikan: 20 Okt 2026', grade: 'AB' },
        { id: 2, type: 'DOPS 1', title: 'Pemasangan Kateter Folley', supervisor: 'dr. Herman, Sp.B', status: 'empty', date: 'Harus diijikan dalam Stase ini', grade: '-' },
    ];

    const getStatusUI = (status: string) => {
        switch (status) {
            case 'approved': return { colorClass: 'status-green', label: 'Telah Dinilai', icon: <CheckCircle size={16}/> };
            case 'pending': return { colorClass: 'status-yellow', label: 'Menunggu Maju', icon: <Clock size={16}/> };
            case 'empty': return { colorClass: 'status-gray', label: 'Belum Dikerjakan', icon: <AlertCircle size={16}/> };
            default: return { colorClass: 'status-gray', label: '-', icon: null };
        }
    };

    const renderCardList = (data: typeof tugasIlmiah) => {
        return (
            <div className="task-grid">
                {data.map(item => {
                    const statusUI = getStatusUI(item.status);
                    return (
                        <div key={item.id} className="task-card fade-in">
                            <div className="task-header">
                                <span className="task-type">{item.type}</span>
                                <span className={`task-badge ${statusUI.colorClass}`}>
                                    {statusUI.icon} {statusUI.label}
                                </span>
                            </div>
                            <h3 className="task-title">{item.title}</h3>
                            <div className="task-meta">
                                <span className="task-meta-item"><UserCheck size={14}/> {item.supervisor}</span>
                                <span className="task-meta-item text-secondary">{item.date}</span>
                            </div>
                            
                            <div className="task-footer">
                                {item.status === 'approved' ? (
                                    <div className="task-grade">
                                        <span className="grade-label">Nilai Akhir:</span>
                                        <span className="grade-score">{item.grade}</span>
                                    </div>
                                ) : (
                                    <button className={`task-action-btn ${item.status === 'empty' ? 'btn-primary' : 'btn-secondary'}`}>
                                        {item.status === 'empty' ? <><Upload size={16}/> Unggah & Ajukan</> : 'Ubah Jadwal'}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="tugas-page animate-fade-in">
            {/* Header Area */}
            <div className="tugas-header-area">
                <div className="header-titles">
                    <h1 className="page-title">Tugas & Evaluasi Stase</h1>
                    <p className="page-subtitle">Kelola laporan ilmiah dan jadwal presentasi kasus Anda secara terstruktur.</p>
                </div>
                
                {/* GPA/Score Summary Widget */}
                <div className="score-summary-widget">
                    <div className="score-info">
                        <span className="score-label">Prediksi Indeks Stase</span>
                        <span className="score-value text-primary">A- (3.75)</span>
                    </div>
                    <div className="score-chart">
                        <div className="circular-chart-placeholder">
                            <span>Excellent</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom Tab Navigation */}
            <div className="tugas-tabs-container">
                <div className="tab-controls">
                    <button 
                        className={`tab-btn ${activeTab === 'ilmiah' ? 'active' : ''}`}
                        onClick={() => setActiveTab('ilmiah')}
                    >
                        <FileText size={18} /> Tugas Ilmiah (3)
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'evaluasi' ? 'active' : ''}`}
                        onClick={() => setActiveTab('evaluasi')}
                    >
                        <UserCheck size={18} /> Evaluasi Klinis (2)
                    </button>
                    <div className={`tab-indicator ${activeTab}`}></div>
                </div>
            </div>

            {/* Content Area */}
            <div className="tugas-content-area">
                {activeTab === 'ilmiah' ? (
                    <div className="tab-content" key="ilmiah">
                        <div className="content-toolbar">
                            <h2>Persyaratan Makalah Ilmiah</h2>
                        </div>
                        {renderCardList(tugasIlmiah)}
                    </div>
                ) : (
                    <div className="tab-content" key="evaluasi">
                        <div className="content-toolbar">
                            <h2>Evaluasi Kemampuan Klinis Terstruktur</h2>
                        </div>
                        {renderCardList(evaluasiKlinis)}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TugasModule;

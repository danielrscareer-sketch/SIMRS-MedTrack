import React from 'react';
import { Target, Calendar, Clock, Award, ChevronRight, Activity } from 'lucide-react';
import './StaseModule.css';

const StaseModule: React.FC = () => {
    // Dummy Data
    const currentStase = {
        name: 'Ilmu Penyakit Dalam',
        hospital: 'RSUP Dr. Sardjito',
        supervisor: 'dr. Budi, Sp.PD',
        startDate: '1 Okt 2026',
        endDate: '28 Okt 2026',
        daysPassed: 18,
        totalDays: 28,
        competencyProgress: 65, // percentage
        nightShiftsDone: 3,
        nightShiftsTotal: 5,
    };

    const targetKasus = [
        { name: 'Dengue Hemorrhagic Fever', target: 5, achieved: 4, level: '4A' },
        { name: 'Typhoid Fever', target: 3, achieved: 3, level: '4A' },
        { name: 'Acute Myocardial Infarction', target: 2, achieved: 1, level: '3B' },
        { name: 'Pneumonia', target: 4, achieved: 2, level: '4A' },
    ];

    const riwayatStase = [
        { name: 'Ilmu Bedah', period: 'Agustus 2026', grade: 'A', status: 'Selesai' },
        { name: 'Ilmu Kesehatan Anak', period: 'September 2026', grade: 'A-', status: 'Selesai' }
    ];

    return (
        <div className="stase-page animate-fade-in">
            {/* Hero Banner: Active Rotation */}
            <div className="stase-hero-card">
                <div className="stase-hero-bg"></div>
                <div className="stase-hero-content">
                    <div className="hero-header">
                        <span className="stase-badge">Stase Berjalan</span>
                        <h1 className="hero-title">{currentStase.name}</h1>
                        <p className="hero-subtitle">{currentStase.hospital} • {currentStase.supervisor}</p>
                    </div>

                    <div className="hero-progress-section">
                        <div className="progress-labels">
                            <span className="time-passed">Hari ke-{currentStase.daysPassed}</span>
                            <span className="time-total">dari {currentStase.totalDays} Hari</span>
                        </div>
                        <div className="progress-bar-bg">
                            <div 
                                className="progress-bar-fill" 
                                style={{ width: `${(currentStase.daysPassed / currentStase.totalDays) * 100}%` }}
                            ></div>
                        </div>
                        <p className="date-range">{currentStase.startDate} — {currentStase.endDate}</p>
                    </div>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="stase-metrics-grid">
                {/* Competency Targets Panel */}
                <div className="stase-panel competency-panel">
                    <div className="panel-header">
                        <div className="panel-title-group">
                            <Target className="panel-icon text-primary" size={24} />
                            <h2>Target Kasus Penyakit</h2>
                        </div>
                        <span className="overall-progress">{currentStase.competencyProgress}% Tercapai</span>
                    </div>
                    
                    <div className="target-list">
                        {targetKasus.map((kasus, idx) => (
                            <div key={idx} className="target-item">
                                <div className="target-info">
                                    <h4 className="kasus-name">{kasus.name}</h4>
                                    <span className="kasus-level">Level {kasus.level}</span>
                                </div>
                                <div className="target-track">
                                    <div className="target-numbers">
                                        <span className="achieved">{kasus.achieved}</span> / {kasus.target}
                                    </div>
                                    <div className="mini-progress-bg">
                                        <div 
                                            className={`mini-progress-fill ${kasus.achieved >= kasus.target ? 'completed' : ''}`}
                                            style={{ width: `${Math.min((kasus.achieved / kasus.target) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Night Shifts & Schedule */}
                <div className="stase-panel schedule-panel">
                    <div className="panel-header">
                        <div className="panel-title-group">
                            <Clock className="panel-icon text-accent" size={24} />
                            <h2>Jadwal Jaga Malam & Ujian</h2>
                        </div>
                    </div>

                    <div className="shift-summary">
                        <div className="shift-chart">
                            <span className="shift-number text-accent">{currentStase.nightShiftsDone}</span>
                            <span className="shift-divider">/</span>
                            <span className="shift-total">{currentStase.nightShiftsTotal}</span>
                        </div>
                        <p className="shift-label">Shift Malam Selesai</p>
                    </div>

                    <div className="upcoming-events">
                        <div className="event-item">
                            <div className="event-icon-box bg-accent-light">
                                <Calendar size={18} className="text-accent" />
                            </div>
                            <div className="event-details">
                                <h4>Jaga IGD (Malam)</h4>
                                <p>Jumat, 22 Okt 2026 • 20:00 - 08:00</p>
                            </div>
                        </div>
                        <div className="event-item border-l-primary">
                            <div className="event-icon-box bg-primary-light">
                                <Activity size={18} className="text-primary" />
                            </div>
                            <div className="event-details">
                                <h4>Ujian Mini-CEX</h4>
                                <p>Senin, 25 Okt 2026 • Bersama dr. Budi</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* History Section */}
            <div className="stase-history-section content-card">
                <div className="panel-header border-bottom">
                    <div className="panel-title-group">
                        <Award className="panel-icon text-success" size={24} />
                        <h2>Riwayat Stase Sebelumnya</h2>
                    </div>
                </div>
                
                <div className="history-list">
                    {riwayatStase.map((history, i) => (
                        <div key={i} className="history-item hover-action">
                            <div className="history-main">
                                <h3>{history.name}</h3>
                                <p>{history.period}</p>
                            </div>
                            <div className="history-grade">
                                <div className="grade-circle">{history.grade}</div>
                                <span className="status-label">{history.status}</span>
                            </div>
                            <ChevronRight className="text-muted" size={20} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default StaseModule;

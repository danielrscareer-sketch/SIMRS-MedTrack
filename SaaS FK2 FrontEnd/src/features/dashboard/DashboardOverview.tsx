import React from 'react';
import { HeartPulse, Syringe, Microscope, Stethoscope, ClipboardList, CalendarClock } from 'lucide-react';
import './DashboardOverview.css';

const DashboardOverview: React.FC = () => {
    // Get role from local storage so UI text adapts slightly based on user type.
    const userRole = localStorage.getItem('userRole') || 'mahasiswakoas';
    const isDosen = userRole === 'dosen';
    const isAdmin = userRole === 'admin';

    return (
        <div className="overview-page animate-fade-in">
            <header className="overview-header">
                <h1 className="overview-title">
                    {isAdmin ? 'Dashboard Administrasi FK' : isDosen ? 'Dashboard Pengajar Klinik' : 'Ringkasan Akademik Koas'}
                </h1>
                <p className="overview-subtitle">
                    {isAdmin 
                        ? 'Pantau statistik fakultas dan kegiatan rotasi klinik secara real-time.' 
                        : isDosen 
                        ? 'Pantau permohonan logbook dan evaluasi tugas mahasiswa bimbingan Anda.'
                        : 'Pantau progress stase dan pencapaian target kompetensi klinikal Anda.'}
                </p>
            </header>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-label">{isAdmin ? 'Total Stase Aktif' : isDosen ? 'Mahasiswa Bimbingan' : 'Stase Aktif'}</span>
                        <div className="stat-icon-wrapper primary animate-heartbeat">
                            <HeartPulse size={24} />
                        </div>
                    </div>
                    <div className="stat-card-body">
                        <h3 className="stat-value">{isAdmin ? '42' : isDosen ? '12 Mahasiswa' : 'Ilmu Penyakit Dalam'}</h3>
                        <p className="stat-desc success">{isAdmin ? 'Berjalan lancar' : isDosen ? '2 Perlu Perhatian' : 'Sisa 2 Minggu'}</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-label">{isAdmin ? 'Laporan Kendala' : isDosen ? 'Tinjauan Kasus' : 'Log Book Pending'}</span>
                        <div className="stat-icon-wrapper warning animate-float">
                            <ClipboardList size={24} />
                        </div>
                    </div>
                    <div className="stat-card-body">
                        <h3 className="stat-value">{isAdmin ? '2 Tiket' : isDosen ? '14 Entri' : '4 Entri'}</h3>
                        <p className="stat-desc warning-text">{isAdmin ? 'Perlu tindakan dari TU' : isDosen ? 'Dari 4 mahasiswa' : 'Perlu diverifikasi dosen'}</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-label">{isAdmin ? 'Persentase Lulus' : isDosen ? 'Analisis Laboratorium' : 'Target Kompetensi'}</span>
                        <div className="stat-icon-wrapper success animate-pulse-slow">
                            <Microscope size={24} />
                        </div>
                    </div>
                    <div className="stat-card-body">
                        <h3 className="stat-value">85%</h3>
                        <p className="stat-desc success">+5% minggu ini</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-label">{isAdmin ? 'Total Pengguna Aktif' : isDosen ? 'Tindakan Medis' : 'Pasien Diperiksa'}</span>
                        <div className="stat-icon-wrapper accent animate-float-delayed">
                            {isAdmin ? <Stethoscope size={24} /> : <Syringe size={24} />}
                        </div>
                    </div>
                    <div className="stat-card-body">
                        <h3 className="stat-value">{isAdmin ? '2,401' : isDosen ? '48' : '124'}</h3>
                        <p className="stat-desc muted">{isAdmin ? 'Mahasiswa & Dokter' : isDosen ? 'Bulan ini' : 'Total di seluruh stase'}</p>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="overview-content-grid">
                {/* Progress Card */}
                <div className="main-panel progress-panel">
                    <h3 className="panel-title">{isDosen ? 'Progress Log Book Mahasiswa (Rata-rata)' : 'Progress Klinikal (Penyakit Dalam)'}</h3>
                    
                    <div className="skills-list">
                        {(isAdmin || isDosen) ? (
                            [
                                { name: 'Ilmu Penyakit Dalam', progress: 85 },
                                { name: 'Ilmu Bedah', progress: 60 },
                                { name: 'Obstetri & Ginekologi', progress: 45 },
                                { name: 'Ilmu Kesehatan Anak', progress: 92 }
                            ].map((dept, i) => (
                                <div className="skill-item" key={i}>
                                    <div className="skill-info">
                                        <span className="skill-name">{dept.name}</span>
                                        <span className="skill-percentage">{dept.progress}%</span>
                                    </div>
                                    <div className="progress-track">
                                        <div 
                                            className="progress-fill"
                                            style={{ width: `${dept.progress}%`, background: dept.progress < 50 ? 'var(--warning)' : 'var(--primary)' }}
                                        ></div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            ['Anamnesis Dasar', 'Pemeriksaan Fisik Thorax', 'Interpretasi EKG', 'Penyusunan Rekam Medis'].map((skill, i) => {
                                const percentages = [80, 60, 40, 90];
                                const currentValue = percentages[i];
                                return (
                                    <div className="skill-item" key={i}>
                                        <div className="skill-info">
                                            <span className="skill-name">{skill}</span>
                                            <span className="skill-percentage">{currentValue}%</span>
                                        </div>
                                        <div className="progress-track">
                                            <div 
                                                className="progress-fill"
                                                style={{ width: `${currentValue}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Schedule Card */}
                <div className="main-panel schedule-panel">
                    <h3 className="panel-title">
                        {isAdmin ? 'Aktivitas Administrasi & Plotting' : isDosen ? 'Jadwal Jaga & Bimbingan Dosen' : 'Jadwal Rotasi & Jaga Malam'}
                    </h3>
                    
                    <div className="schedule-list">
                        {/* Tampilan ADMIN */}
                        {isAdmin && (
                            <>
                                <div className="schedule-item">
                                    <div className="schedule-date primary-date"><span className="date-number">12</span><span className="date-month">Okt</span></div>
                                    <div className="schedule-details">
                                        <h4 className="schedule-event">Evaluasi Logbook Stase Anak</h4>
                                        <p className="schedule-location">Seluruh Mahasiswa Anak</p>
                                    </div>
                                    <CalendarClock size={20} className="text-primary opacity-50" />
                                </div>
                                <div className="schedule-item">
                                    <div className="schedule-date accent-date"><span className="date-number">15</span><span className="date-month">Okt</span></div>
                                    <div className="schedule-details">
                                        <h4 className="schedule-event">Rombongan Rotasi Pindah Stase</h4>
                                        <p className="schedule-location">Bedah -&gt; Penyakit Dalam</p>
                                    </div>
                                    <CalendarClock size={20} className="text-accent opacity-50" />
                                </div>
                            </>
                        )}

                        {/* Tampilan DOSEN */}
                        {isDosen && (
                            <>
                                <div className="schedule-item">
                                    <div className="schedule-date primary-date"><span className="date-number">14</span><span className="date-month">Okt</span></div>
                                    <div className="schedule-details">
                                        <h4 className="schedule-event">Konsulen Jaga Bangsal Harian</h4>
                                        <p className="schedule-location">Ruang Rawat Inap Teratai</p>
                                    </div>
                                    <CalendarClock size={20} className="text-primary opacity-50" />
                                </div>
                                <div className="schedule-item">
                                    <div className="schedule-date accent-date"><span className="date-number">16</span><span className="date-month">Okt</span></div>
                                    <div className="schedule-details">
                                        <h4 className="schedule-event">Pemaparan Jurnal / Bimbingan</h4>
                                        <p className="schedule-location">Mahasiswa: Budi, Citra, Andi</p>
                                    </div>
                                    <CalendarClock size={20} className="text-accent opacity-50" />
                                </div>
                            </>
                        )}

                        {/* Tampilan MAHASISWA */}
                        {!isAdmin && !isDosen && (
                            <>
                                <div className="schedule-item">
                                    <div className="schedule-date primary-date"><span className="date-number">Minggu</span><span className="date-month">Ini</span></div>
                                    <div className="schedule-details">
                                        <h4 className="schedule-event">Jadwal Rotasi Saat Ini</h4>
                                        <p className="schedule-location">Stase Ilmu Penyakit Dalam (Minggu ke-4)</p>
                                    </div>
                                    <CalendarClock size={20} className="text-primary opacity-50" />
                                </div>
                                <div className="schedule-item">
                                    <div className="schedule-date accent-date"><span className="date-number">15</span><span className="date-month">Okt</span></div>
                                    <div className="schedule-details">
                                        <h4 className="schedule-event">Jadwal Jaga Malam (IGD)</h4>
                                        <p className="schedule-location">Shift 20:00 - 08:00 WIB</p>
                                    </div>
                                    <CalendarClock size={20} className="text-accent opacity-50" />
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Active Rotation / Practical Info Widget */}
                <div className="main-panel er-panel shadow-lg hover-action">
                    <h3 className="panel-title er-title">{isAdmin ? 'Informasi Institusi Jejaring' : isDosen ? 'Pusat Manajemen Bimbingan' : 'Pusat Informasi Stase Saat Ini'}</h3>
                    <div className="er-content">
                        <div className="er-stat">
                            <span className="er-stat-value">{isAdmin ? '18' : isDosen ? '14 Hari' : '14 Hari'}</span>
                            <span className="er-stat-label">{isAdmin ? 'RS Mitra Aktif' : isDosen ? 'Sisa Waktu Blok' : 'Sisa Waktu Stase'}</span>
                        </div>
                        <div className="er-stat">
                            <span className="er-stat-value text-accent">{isAdmin ? 'Akreditasi A' : isDosen ? 'RSUD Utama' : 'RSUD Jejaring'}</span>
                            <span className="er-stat-label">{isAdmin ? 'Standar Kelayakan' : isDosen ? 'Lokasi Praktik' : 'Lokasi Dinas'}</span>
                        </div>
                        <div className="er-stat">
                            <span className="er-stat-value text-success">{isAdmin ? 'Lengkap' : isDosen ? '80%' : 'dr. Budi, Sp.PD'}</span>
                            <span className="er-stat-label">{isAdmin ? 'Dokumen MoU' : isDosen ? 'Kehadiran Koas' : 'Supervisor Utama'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardOverview;

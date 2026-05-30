import React, { useState } from 'react';
import { Search, TrendingUp, Users, AlertTriangle, CheckCircle, Download, BarChart2 } from 'lucide-react';
import './RekapNilai.css';

interface MahasiswaRekap {
    id: string;
    name: string;
    nim: string;
    stase: string;
    dokterSpesialis: string;
    dokterUnit: string;
    totalLogbook: number;
    kuotaTarget: number;
    nilaiLogbook: number;
    nilaiTugas: number;
    tugasSelesai: number;
    tugasTarget: number;
    status: 'On Track' | 'Berisiko' | 'Lulus Stase';
}

const convertGrade = (score: number): string => {
    if (score >= 85) return 'A';
    if (score >= 80) return 'A-';
    if (score >= 75) return 'B+';
    if (score >= 70) return 'B';
    if (score >= 65) return 'C+';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'E';
};

const DUMMY_REKAP: MahasiswaRekap[] = [
    {
        id: 'MHS-001', name: 'Andi Saputra', nim: '210101001', stase: 'Ilmu Penyakit Dalam',
        dokterSpesialis: 'Dr. Budi Santoso, Sp.PD', dokterUnit: 'Dr. Ahmad (Ruangan)',
        totalLogbook: 38, kuotaTarget: 50, nilaiLogbook: 85, nilaiTugas: 80,
        tugasSelesai: 2, tugasTarget: 3, status: 'On Track'
    },
    {
        id: 'MHS-002', name: 'Budi Raharjo', nim: '210101002', stase: 'Ilmu Penyakit Dalam',
        dokterSpesialis: 'Dr. Budi Santoso, Sp.PD', dokterUnit: 'Dr. Ridwan (IGD)',
        totalLogbook: 12, kuotaTarget: 50, nilaiLogbook: 70, nilaiTugas: 75,
        tugasSelesai: 1, tugasTarget: 3, status: 'Berisiko'
    },
    {
        id: 'MHS-003', name: 'Citra Kirana', nim: '210101003', stase: 'Ilmu Bedah',
        dokterSpesialis: 'Dr. Herman, Sp.B', dokterUnit: 'Dr. Jaka (OK)',
        totalLogbook: 52, kuotaTarget: 50, nilaiLogbook: 90, nilaiTugas: 88,
        tugasSelesai: 3, tugasTarget: 3, status: 'Lulus Stase'
    },
    {
        id: 'MHS-004', name: 'Dewi Lestari', nim: '210101004', stase: 'Ilmu Kesehatan Anak',
        dokterSpesialis: 'Dr. Siti, Sp.A', dokterUnit: 'Dr. Nabilah (Bangsal)',
        totalLogbook: 45, kuotaTarget: 50, nilaiLogbook: 78, nilaiTugas: 82,
        tugasSelesai: 2, tugasTarget: 3, status: 'On Track'
    },
    {
        id: 'MHS-005', name: 'Eka Wahyuni', nim: '210101005', stase: 'Ilmu Kesehatan Anak',
        dokterSpesialis: 'Dr. Siti, Sp.A', dokterUnit: 'Dr. Nabilah (Bangsal)',
        totalLogbook: 8, kuotaTarget: 50, nilaiLogbook: 60, nilaiTugas: 65,
        tugasSelesai: 0, tugasTarget: 3, status: 'Berisiko'
    },
];

const RekapNilaiModule: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('All');
    const [staseFilter, setStaseFilter] = useState<string>('All');

    const filtered = DUMMY_REKAP.filter(m =>
        (statusFilter === 'All' || m.status === statusFilter) &&
        (staseFilter === 'All' || m.stase === staseFilter) &&
        (m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.nim.includes(searchTerm))
    );

    const totalBerisiko = DUMMY_REKAP.filter(m => m.status === 'Berisiko').length;
    const totalLulus = DUMMY_REKAP.filter(m => m.status === 'Lulus Stase').length;
    const totalOnTrack = DUMMY_REKAP.filter(m => m.status === 'On Track').length;

    return (
        <div className="rekap-page animate-fade-in">
            <header className="rekap-header">
                <div>
                    <h1 className="page-title">Rekap Nilai &amp; Progres Koas</h1>
                    <p className="page-subtitle">Pantau kuota logbook, nilai akhir, dan status kelulusan stase seluruh mahasiswa.</p>
                </div>
                <button
                    className="btn-primary"
                    onClick={() => alert('Fitur ekspor PDF rekapitulasi akan segera hadir.')}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Download size={18} /> Ekspor Rekap PDF
                </button>
            </header>

            {/* Summary Cards */}
            <div className="summary-grid">
                <div className="summary-card blue">
                    <div className="summary-icon"><Users size={24} /></div>
                    <div>
                        <p className="summary-label">Total Mahasiswa</p>
                        <p className="summary-value">{DUMMY_REKAP.length}</p>
                    </div>
                </div>
                <div className="summary-card green">
                    <div className="summary-icon"><CheckCircle size={24} /></div>
                    <div>
                        <p className="summary-label">Lulus Stase</p>
                        <p className="summary-value">{totalLulus}</p>
                    </div>
                </div>
                <div className="summary-card yellow">
                    <div className="summary-icon"><TrendingUp size={24} /></div>
                    <div>
                        <p className="summary-label">On Track</p>
                        <p className="summary-value">{totalOnTrack}</p>
                    </div>
                </div>
                <div className="summary-card red">
                    <div className="summary-icon"><AlertTriangle size={24} /></div>
                    <div>
                        <p className="summary-label">Berisiko (Kuota Rendah)</p>
                        <p className="summary-value">{totalBerisiko}</p>
                    </div>
                </div>
            </div>

            {/* Filter Toolbar */}
            <div className="rekap-toolbar">
                <div className="search-bar">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Cari nama atau NIM..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="All">Semua Status</option>
                    <option value="Lulus Stase">Lulus Stase</option>
                    <option value="On Track">On Track</option>
                    <option value="Berisiko">Berisiko</option>
                </select>
                <select value={staseFilter} onChange={e => setStaseFilter(e.target.value)}>
                    <option value="All">Semua Stase</option>
                    <option value="Ilmu Penyakit Dalam">Ilmu Penyakit Dalam</option>
                    <option value="Ilmu Bedah">Ilmu Bedah</option>
                    <option value="Ilmu Kesehatan Anak">Ilmu Kesehatan Anak</option>
                </select>
            </div>

            {/* Table */}
            <div className="rekap-table-wrapper">
                <table className="rekap-table">
                    <thead>
                        <tr>
                            <th>Mahasiswa</th>
                            <th>Stase</th>
                            <th>Pengawas Dominan</th>
                            <th>Logbook</th>
                            <th>Tugas</th>
                            <th>Nilai Logbook</th>
                            <th>Nilai Tugas</th>
                            <th>Rata-rata</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(m => {
                            const avg = Math.round((m.nilaiLogbook + m.nilaiTugas) / 2);
                            const logbookPct = Math.min(100, Math.round((m.totalLogbook / m.kuotaTarget) * 100));
                            return (
                                <tr key={m.id}>
                                    <td>
                                        <strong>{m.name}</strong>
                                        <br />
                                        <span className="text-muted">{m.nim}</span>
                                    </td>
                                    <td>{m.stase}</td>
                                    <td>
                                        <span style={{ display: 'block', fontSize: '0.8rem' }}>
                                            <span className="role-chip spesialis">DPJP:</span> {m.dokterSpesialis.split(',')[0]}
                                        </span>
                                        <span style={{ display: 'block', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                                            <span className="role-chip unit">Unit:</span> {m.dokterUnit}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="progress-pill">
                                            <div className="progress-bar-track">
                                                <div
                                                    className="progress-bar-fill"
                                                    style={{ width: `${logbookPct}%`, background: logbookPct >= 100 ? '#10B981' : logbookPct >= 60 ? '#F59E0B' : '#EF4444' }}
                                                />
                                            </div>
                                            <span>{m.totalLogbook}/{m.kuotaTarget}</span>
                                        </div>
                                    </td>
                                    <td>{m.tugasSelesai}/{m.tugasTarget} selesai</td>
                                    <td>
                                        <span className="grade-display">{m.nilaiLogbook} <strong>({convertGrade(m.nilaiLogbook)})</strong></span>
                                    </td>
                                    <td>
                                        <span className="grade-display">{m.nilaiTugas} <strong>({convertGrade(m.nilaiTugas)})</strong></span>
                                    </td>
                                    <td>
                                        <span className="grade-avg">{avg} <strong>({convertGrade(avg)})</strong></span>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${m.status === 'Lulus Stase' ? 'lulus' : m.status === 'Berisiko' ? 'berisiko' : 'ontrack'}`}>
                                            {m.status === 'Berisiko' && <AlertTriangle size={12} />}
                                            {m.status === 'Lulus Stase' && <CheckCircle size={12} />}
                                            {m.status === 'On Track' && <BarChart2 size={12} />}
                                            {m.status}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RekapNilaiModule;

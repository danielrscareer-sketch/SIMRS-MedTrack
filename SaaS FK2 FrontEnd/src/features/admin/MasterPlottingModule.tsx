import React, { useState } from 'react';
import { UserPlus, Save, Search, Building, Users, MapPin } from 'lucide-react';
import './MasterPlotting.css';

interface PlottingRecord {
    id: string;
    studentName: string;
    rm: string;
    stase: string;
    dosen: string;
    rs: string;
    startDate: string;
    endDate: string;
    status: 'Aktif' | 'Menunggu' | 'Selesai';
}

const DUMMY_DATA: PlottingRecord[] = [
    { id: 'PL-001', studentName: 'Andi Saputra', rm: 'NIM-2022001', stase: 'Ilmu Penyakit Dalam', dosen: 'Dr. Budi Santoso, Sp.PD', rs: 'RSUP dr. Sardjito', startDate: '2026-10-01', endDate: '2026-11-15', status: 'Aktif' },
    { id: 'PL-002', studentName: 'Budi Raharjo', rm: 'NIM-2022002', stase: 'Ilmu Penyakit Dalam', dosen: 'Dr. Budi Santoso, Sp.PD', rs: 'RSUP dr. Sardjito', startDate: '2026-10-01', endDate: '2026-11-15', status: 'Aktif' },
    { id: 'PL-003', studentName: 'Citra Kirana', rm: 'NIM-2022003', stase: 'Ilmu Bedah', dosen: 'Dr. Ahmad Yani, Sp.B', rs: 'RSUD Sleman', startDate: '2026-09-15', endDate: '2026-10-30', status: 'Aktif' },
    { id: 'PL-004', studentName: 'Dewi Lestari', rm: 'NIM-2022004', stase: 'Ilmu Kesehatan Anak', dosen: 'Dr. Siska, Sp.A', rs: 'RS Bhayangkara', startDate: '2026-11-01', endDate: '2026-12-15', status: 'Menunggu' },
];

const MasterPlottingModule: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [records, setRecords] = useState<PlottingRecord[]>(DUMMY_DATA);
    
    // Form State
    const [selectedStudent, setSelectedStudent] = useState('');
    const [selectedStase, setSelectedStase] = useState('Ilmu Penyakit Dalam');
    const [selectedDosen, setSelectedDosen] = useState('');
    const [selectedRs, setSelectedRs] = useState('RSUP dr. Sardjito');

    const filteredRecords = records.filter(f => 
        f.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        f.rs.toLowerCase().includes(searchTerm.toLowerCase()) || 
        f.dosen.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSimulatePlotting = (e: React.FormEvent) => {
        e.preventDefault();
        if(!selectedStudent || !selectedDosen) return alert("Pilih mahasiswa dan dosen terlebih dahulu!");

        const newRecord: PlottingRecord = {
            id: `PL-00${records.length + 1}`,
            studentName: selectedStudent,
            rm: `NIM-NEW`,
            stase: selectedStase,
            dosen: selectedDosen,
            rs: selectedRs,
            startDate: new Date().toISOString().split('T')[0],
            endDate: '2026-12-31',
            status: 'Aktif'
        };
        setRecords([newRecord, ...records]);
        setSelectedStudent('');
        setSelectedDosen('');
        alert("Plotting berhasil! Mahasiswa kini terikat dengan RS Jejaring & Dosen terkait.");
    };

    return (
        <div className="plotting-page animate-fade-in">
            <header className="plotting-header">
                <div>
                    <h1 className="page-title">Command Center Plotting Rotasi</h1>
                    <p className="page-subtitle">Kelola penugasan rotasi klinik mahasiswa, rumah sakit jejaring, dan pembimbing klinik.</p>
                </div>
            </header>

            {/* Dashboard Analytics Bar */}
            <div className="analytics-dashboard animate-slide-up">
                <div className="stat-card">
                    <div className="stat-icon"><Users size={24} /></div>
                    <div className="stat-data">
                        <h4>Total Koas Aktif</h4>
                        <h2>142 <span>Orang</span></h2>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}><Building size={24} /></div>
                    <div className="stat-data">
                        <h4>Kapasitas RS Jejaring</h4>
                        <h2>85% <span>Terisi</span></h2>
                    </div>
                </div>
                <div className="stat-card distribution-card">
                    <h4>Distribusi Stase Terbanyak</h4>
                    <div className="progress-group">
                        <div className="progress-label"><span>Ilmu Penyakit Dalam</span> <span>45 Koas</span></div>
                        <div className="progress-track"><div className="progress-bar" style={{ width: '80%', backgroundColor: 'var(--primary)' }}></div></div>
                    </div>
                    <div className="progress-group" style={{ marginTop: '0.8rem' }}>
                        <div className="progress-label"><span>Ilmu Bedah</span> <span>32 Koas</span></div>
                        <div className="progress-track"><div className="progress-bar" style={{ width: '60%', backgroundColor: 'var(--accent)' }}></div></div>
                    </div>
                </div>
            </div>

            <div className="plotting-layout" style={{ marginTop: '2rem' }}>
                {/* Form Plotting */}
                <div className="plotting-panel animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <h3><UserPlus size={20} style={{ display: 'inline', marginRight: '0.5rem', color: 'var(--primary)' }}/> Plotting Baru</h3>
                    <form onSubmit={handleSimulatePlotting} className="plotting-form">
                        <div className="form-group">
                            <label>Nama Mahasiswa</label>
                            <input type="text" className="custom-input" placeholder="Masukkan nama mahasiswa..." value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} required />
                        </div>
                        
                        <div className="form-group">
                            <label>Stase / Departemen</label>
                            <select className="custom-input" value={selectedStase} onChange={e => setSelectedStase(e.target.value)}>
                                <option>Ilmu Penyakit Dalam</option>
                                <option>Ilmu Bedah</option>
                                <option>Ilmu Kesehatan Anak</option>
                                <option>Obstetri & Ginekologi</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>RS Jejaring Penempatan</label>
                            <select className="custom-input" value={selectedRs} onChange={e => setSelectedRs(e.target.value)}>
                                <option>RSUP dr. Sardjito</option>
                                <option>RSUD Sleman</option>
                                <option>RS Bhayangkara</option>
                                <option>RSUD Wates</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Dosen Pembimbing (DPJP)</label>
                            <input type="text" className="custom-input" placeholder="Ketik nama dosen..." value={selectedDosen} onChange={e => setSelectedDosen(e.target.value)} required />
                        </div>

                        <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                            <Save size={18} /> Simpan Plotting
                        </button>
                    </form>
                </div>

                {/* List Plotting Aktif */}
                <div className="plotting-panel animate-slide-up" style={{ animationDelay: '0.2s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0 }}><Building size={20} style={{ display: 'inline', marginRight: '0.5rem', color: 'var(--text-primary)' }}/> Daftar Penempatan Aktif</h3>
                        <div className="search-bar" style={{ width: '220px' }}>
                            <Search size={16} color="var(--text-secondary)" />
                            <input type="text" placeholder="Cari RS atau Nama..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', padding: '0.4rem' }} />
                        </div>
                    </div>

                    <div className="modern-list">
                        {filteredRecords.map(record => (
                            <div key={record.id} className="list-item">
                                <div className="list-item-main">
                                    <h4 className="student-name">{record.studentName}</h4>
                                    <span className={`status-badge ${record.status.toLowerCase()}`}>{record.status}</span>
                                </div>
                                <div className="list-item-details">
                                    <div className="detail-tag"><MapPin size={12} /> {record.rs}</div>
                                    <div className="detail-tag"><Users size={12} /> {record.dosen}</div>
                                </div>
                                <div className="list-item-stase">
                                    {record.stase} <span className="date-range">({record.startDate} s/d {record.endDate})</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MasterPlottingModule;

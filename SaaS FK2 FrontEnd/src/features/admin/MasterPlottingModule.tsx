import React, { useState } from 'react';
import { UserPlus, Save, Search, Building } from 'lucide-react';
import './MasterPlotting.css';

interface PlottingRecord {
    id: string;
    studentName: string;
    rm: string;
    stase: string;
    dosen: string;
    startDate: string;
    endDate: string;
    status: 'Aktif' | 'Menunggu' | 'Selesai';
}

const DUMMY_DATA: PlottingRecord[] = [
    { id: 'PL-001', studentName: 'Andi Saputra', rm: 'NIM-2022001', stase: 'Ilmu Penyakit Dalam', dosen: 'Dr. Budi Santoso, Sp.PD', startDate: '2026-10-01', endDate: '2026-11-15', status: 'Aktif' },
    { id: 'PL-002', studentName: 'Budi Raharjo', rm: 'NIM-2022002', stase: 'Ilmu Penyakit Dalam', dosen: 'Dr. Budi Santoso, Sp.PD', startDate: '2026-10-01', endDate: '2026-11-15', status: 'Aktif' },
    { id: 'PL-003', studentName: 'Citra Kirana', rm: 'NIM-2022003', stase: 'Ilmu Bedah', dosen: 'Dr. Ahmad Yani, Sp.B', startDate: '2026-09-15', endDate: '2026-10-30', status: 'Aktif' },
    { id: 'PL-004', studentName: 'Dewi Lestari', rm: 'NIM-2022004', stase: 'Ilmu Kesehatan Anak', dosen: 'Dr. Siska, Sp.A', startDate: '2026-11-01', endDate: '2026-12-15', status: 'Menunggu' },
];

const MasterPlottingModule: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [records, setRecords] = useState<PlottingRecord[]>(DUMMY_DATA);
    
    // Form State
    const [selectedStudent, setSelectedStudent] = useState('');
    const [selectedStase, setSelectedStase] = useState('Ilmu Penyakit Dalam');
    const [selectedDosen, setSelectedDosen] = useState('');

    const filteredRecords = records.filter(f => 
        f.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
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
            startDate: new Date().toISOString().split('T')[0],
            endDate: '2026-12-31',
            status: 'Aktif'
        };
        setRecords([newRecord, ...records]);
        setSelectedStudent('');
        setSelectedDosen('');
        alert("Plotting berhasil! Mahasiswa kini terikat dengan Dosen tersebut di stase terkait.");
    };

    return (
        <div className="plotting-page animate-fade-in">
            <header className="plotting-header">
                <div>
                    <h1 className="page-title">Master Plotting & Rotasi</h1>
                    <p className="page-subtitle">Pusat penempatan mahasiswa stase ke Dosen Supervisor oleh Tata Usaha.</p>
                </div>
                <div className="plotting-toolbar">
                    <div className="search-bar">
                        <Search size={18} color="var(--text-secondary)" />
                        <input 
                            type="text" 
                            placeholder="Cari mahasiswa atau dosen..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </header>

            <div className="plotting-layout">
                {/* Form Tambah Plotting */}
                <div className="plotting-card panel-form">
                    <h2 className="panel-title"><UserPlus size={20} /> Input Rotasi Baru</h2>
                    <form onSubmit={handleSimulatePlotting} className="plotting-form">
                        <div className="form-group">
                            <label>Pilih Mahasiswa Koas</label>
                            <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} required>
                                <option value="">- Silakan Pilih Mahasiswa -</option>
                                <option value="Eka Wahyuni">Eka Wahyuni</option>
                                <option value="Fajar Siddiq">Fajar Siddiq</option>
                                <option value="Gita Gutawa">Gita Gutawa</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Stase / Departemen</label>
                            <select value={selectedStase} onChange={e => setSelectedStase(e.target.value)} required>
                                <option value="Ilmu Penyakit Dalam">Ilmu Penyakit Dalam</option>
                                <option value="Ilmu Bedah">Ilmu Bedah</option>
                                <option value="Ilmu Kesehatan Anak">Ilmu Kesehatan Anak</option>
                                <option value="Obstetri & Ginekologi">Obstetri & Ginekologi</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Dosen Pembimbing (Supervisor)</label>
                            <select value={selectedDosen} onChange={e => setSelectedDosen(e.target.value)} required>
                                <option value="">- Pilih Dosen (Difilter sesuai Stase) -</option>
                                <option value="Dr. Budi Santoso, Sp.PD">Dr. Budi Santoso, Sp.PD (Kapasitas: 4)</option>
                                <option value="Dr. Ahmad Yani, Sp.B">Dr. Ahmad Yani, Sp.B (Kapasitas: 2)</option>
                                <option value="Dr. Siska, Sp.A">Dr. Siska, Sp.A (Kapasitas: 5)</option>
                            </select>
                        </div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Tanggal Mulai</label>
                                <input type="date" required />
                            </div>
                            <div className="form-group">
                                <label>Tanggal Selesai</label>
                                <input type="date" required />
                            </div>
                        </div>
                        <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem', justifyContent: 'center' }}>
                            <Save size={18} /> Simpan Plotting
                        </button>
                    </form>
                </div>

                {/* List Data Plotting Aktif */}
                <div className="plotting-card panel-list">
                    <h2 className="panel-title"><Building size={20} /> Data Rotasi Mahasiswa Aktif</h2>
                    <div className="table-responsive">
                        <table className="plotting-table">
                            <thead>
                                <tr>
                                    <th>Mahasiswa</th>
                                    <th>Stase</th>
                                    <th>Dosen Pembimbing</th>
                                    <th>Periode</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRecords.map(rec => (
                                    <tr key={rec.id}>
                                        <td className="font-semibold">{rec.studentName} <br/><span style={{fontSize:'0.75rem', color:'var(--text-tertiary)', fontWeight:'normal'}}>{rec.rm}</span></td>
                                        <td>{rec.stase}</td>
                                        <td>{rec.dosen}</td>
                                        <td>{rec.startDate} s/d {rec.endDate}</td>
                                        <td>
                                            <span className={`badge-status ${rec.status === 'Aktif' ? 'active' : rec.status === 'Menunggu' ? 'waiting' : 'finished'}`}>
                                                {rec.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MasterPlottingModule;

import React, { useState } from 'react';
import { Plus, Search, Filter, CheckCircle, Clock, XCircle, FileText, Download } from 'lucide-react';
import LogbookForm from './components/LogbookForm';
import './LogbookModule.css';

// Tipe Data Dummy
type LogStatus = 'pending' | 'approved' | 'rejected';

interface LogEntry {
    id: string;
    date: string;
    stase: string;
    diagnosis: string;
    action: string;
    rm: string;
    peran: string;
    isJagaMalam: boolean;
    dokterSpesialis: string;
    dokterUnit: string;
    dokterKonsul?: string;
    status: LogStatus;
    revisionNote?: string;
}

const DUMMY_LOGS: LogEntry[] = [
    {
        id: 'LOG-001',
        date: '18 Okt 2026',
        stase: 'Ilmu Penyakit Dalam',
        diagnosis: 'DHF Grade II (A91)',
        action: 'Pemasangan IV Line & Resusitasi Cairan',
        rm: 'RM-44919',
        peran: 'Mandiri',
        isJagaMalam: false,
        dokterSpesialis: 'dr. Budi, Sp.PD',
        dokterUnit: 'dr. Indah (Jaga poli)',
        status: 'approved'
    },
    {
        id: 'LOG-002',
        date: '17 Okt 2026',
        stase: 'Ilmu Penyakit Dalam',
        diagnosis: 'STEMI Anterior Extensif',
        action: 'Interpretasi EKG 12 Lead',
        rm: 'RM-59912',
        peran: 'Asistensi',
        isJagaMalam: true,
        dokterSpesialis: '',
        dokterUnit: 'dr. Ridwan (IGD)',
        dokterKonsul: 'dr. Budi, Sp.PD (via Telp)',
        status: 'pending'
    },
    {
        id: 'LOG-003',
        date: '15 Okt 2026',
        stase: 'Ilmu Bedah',
        diagnosis: 'Apendisitis Akut',
        action: 'Asisten 2 Appendectomy Cito',
        rm: 'RM-11204',
        peran: 'Observasi',
        isJagaMalam: true,
        dokterSpesialis: 'dr. Herman, Sp.B',
        dokterUnit: 'dr. Jaka (OK)',
        status: 'rejected',
        revisionNote: 'Tolong lengkapi penjabaran Plan (P) dengan detail edukasi gizi pasien pasca-operasi apendisitis.'
    },
    {
        id: 'LOG-004',
        date: '10 Okt 2026',
        stase: 'Ilmu Kesehatan Anak',
        diagnosis: 'Bronkopneumonia (J18.9)',
        action: 'Suction Lendir & Observasi TTV',
        rm: 'RM-99001',
        peran: 'Observasi',
        isJagaMalam: false,
        dokterSpesialis: 'dr. Siti, Sp.A',
        dokterUnit: 'dr. Nabilah (Bangsal)',
        status: 'approved'
    }
];

const LogbookModule: React.FC = () => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<LogStatus | 'all'>('all');
    const [departemenFilter, setDepartemenFilter] = useState('Semua Stase');

    // Menentukan icon dan class warna berdasarkan status verifikasi
    const getStatusProps = (status: LogStatus) => {
        switch (status) {
            case 'approved':
                return { icon: <CheckCircle size={18} />, text: 'Disetujui', className: 'status-approved' };
            case 'pending':
                return { icon: <Clock size={18} />, text: 'Menunggu', className: 'status-pending' };
            case 'rejected':
                return { icon: <XCircle size={18} />, text: 'Revisi', className: 'status-rejected' };
        }
    };

    // Filter logic
    const filteredLogs = DUMMY_LOGS.filter(log => {
        const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              log.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              log.rm.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
        const matchesDep = departemenFilter === 'Semua Stase' || log.stase === departemenFilter;
        return matchesSearch && matchesStatus && matchesDep;
    });

    return (
        <div className="logbook-page animate-fade-in">
            {/* Header Area */}
            <div className="logbook-header">
                <div className="header-titles">
                    <h1 className="page-title">Buku Log Klinis</h1>
                    <p className="page-subtitle">Catat dan pantau pencapaian tindakan medis harian Anda.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn-secondary" onClick={() => alert('Mengekspor Logbook ke PDF...')}>
                        <Download size={20} />
                        <span>Unduh PDF</span>
                    </button>
                    <button className="btn-primary" onClick={() => setIsFormOpen(true)}>
                        <Plus size={20} />
                        <span>Tambah Tindakan</span>
                    </button>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="logbook-toolbar">
                <div className="search-box">
                    <Search size={20} className="search-icon" />
                    <input 
                        type="text" 
                        placeholder="Cari nama tindakan atau diagnosis ICD..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div className="filter-wrapper">
                    <Filter size={20} className="filter-icon" />
                    <select 
                        className="status-dropdown" 
                        value={departemenFilter}
                        onChange={(e) => setDepartemenFilter(e.target.value)}
                        style={{ marginRight: '0.5rem' }}
                    >
                        <option value="Semua Stase">Semua Departemen</option>
                        <option value="Ilmu Penyakit Dalam">Penyakit Dalam</option>
                        <option value="Ilmu Bedah">Ilmu Bedah</option>
                        <option value="Ilmu Kesehatan Anak">Kesehatan Anak</option>
                        <option value="Obstetri & Ginekologi">Obstetri & Ginekologi</option>
                        <option value="Neurologi">Neurologi (Saraf)</option>
                        <option value="Psikiatri">Psikiatri (Jiwa)</option>
                        <option value="Ilmu Penyakit Mata">Ilmu Penyakit Mata</option>
                        <option value="Ilmu Penyakit THT-KL">Ilmu Penyakit THT-KL</option>
                        <option value="Ilmu Kesehatan Kulit & Kelamin">Kulit & Kelamin</option>
                        <option value="Anestesiologi">Anestesiologi</option>
                        <option value="Radiologi">Radiologi</option>
                        <option value="Forensik & Medikolegal">Forensik & Medikolegal</option>
                        <option value="Ilmu Kesehatan Masyarakat">Kesehatan Masyarakat (IKM)</option>
                    </select>

                    <select 
                        className="status-dropdown" 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as LogStatus | 'all')}
                    >
                        <option value="all">Semua Status</option>
                        <option value="approved">Disetujui</option>
                        <option value="pending">Menunggu Verifikasi</option>
                        <option value="rejected">Butuh Revisi</option>
                    </select>
                </div>
            </div>

            {/* Log Entries List */}
            <div className="log-entries-grid">
                {filteredLogs.map((log) => {
                    const statusProps = getStatusProps(log.status);
                    return (
                        <div key={log.id} className="log-card hover-action">
                            <div className="log-card-header">
                                <span className="log-date">{log.date}</span>
                                <span className={`log-badge ${statusProps.className}`}>
                                    {statusProps.icon}
                                    {statusProps.text}
                                </span>
                            </div>
                            
                            <div className="log-card-body">
                                <h3 className="log-action">{log.action}</h3>
                                <div className="log-detail-row">
                                    <span className="detail-label">Nomor / RM:</span>
                                    <span className="detail-value text-accent font-semibold">{log.rm}</span>
                                </div>
                                <div className="log-detail-row">
                                    <span className="detail-label">Stase:</span>
                                    <span className="detail-value">{log.stase} ({log.peran})</span>
                                </div>
                                <div className="log-detail-row">
                                    <span className="detail-label">Diagnosis:</span>
                                    <span className="detail-value">{log.diagnosis}</span>
                                </div>
                            </div>
                            
                            <div className="log-card-footer" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div className="supervisor-info">
                                        <FileText size={16} className="supervisor-icon" />
                                        <span>
                                            {log.isJagaMalam ? (
                                                <>IGD/Malam (DPJP: {log.dokterSpesialis || log.dokterKonsul || '-'}) - Unit: {log.dokterUnit}</>
                                            ) : (
                                                <>{log.dokterSpesialis} (DPJP)</>
                                            )}
                                        </span>
                                    </div>
                                    {log.status === 'pending' && <p className="action-hint">Sedang direview dosen</p>}
                                </div>
                                {log.status === 'rejected' && log.revisionNote && (
                                    <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '0.75rem', borderRadius: '8px', borderLeft: '3px solid #EF4444', marginTop: '0.5rem' }}>
                                        <strong style={{ fontSize: '0.75rem', color: '#EF4444', display: 'block', marginBottom: '0.25rem' }}>Catatan Revisi Dosen:</strong>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>"{log.revisionNote}"</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {filteredLogs.length === 0 && (
                    <div className="empty-state">
                        <p>Tidak ada catatan log ditemukan.</p>
                    </div>
                )}
            </div>

            {/* Modal Form Tambah Tindakan */}
            <LogbookForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
        </div>
    );
};

export default LogbookModule;

import React, { useState } from 'react';
import { Search, BookOpen, Presentation, CheckCircle, Clock } from 'lucide-react';
import './ValidasiTugas.css';

type TaskType = 'Presentasi Kasus' | 'Journal Reading' | 'Refleksi Kasus';

interface TaskSubmission {
    id: string;
    studentName: string;
    stase: string;
    type: TaskType;
    title: string;
    date: string;
    status: 'Menunggu' | 'Dinilai';
    grade?: string | number;
    fileUrl: string;
}

const DUMMY_TASKS: TaskSubmission[] = [
    {
        id: 'TSK-001', studentName: 'Andi Saputra', stase: 'Ilmu Penyakit Dalam', type: 'Presentasi Kasus',
        title: 'Manajemen Syok Sepsis pada Pasien Geriatri', date: '21 Okt 2026', status: 'Menunggu', fileUrl: 'Sepsis_Andi.ppt'
    },
    {
        id: 'TSK-002', studentName: 'Budi Raharjo', stase: 'Ilmu Penyakit Dalam', type: 'Journal Reading',
        title: 'The Role of SGLT2 Inhibitors in Heart Failure', date: '20 Okt 2026', status: 'Dinilai', grade: 85, fileUrl: 'SGLT2_Budi.pdf'
    },
    {
        id: 'TSK-003', studentName: 'Citra Kirana', stase: 'Ilmu Bedah', type: 'Refleksi Kasus',
        title: 'Insiden Appendisitis Perforasi: Etika Komunikasi Medis', date: '19 Okt 2026', status: 'Menunggu', fileUrl: 'Refleksi_Citra.pdf'
    }
];

const ValidasiTugasModule: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<TaskType | 'All'>('All');
    const [tasks, setTasks] = useState<TaskSubmission[]>(DUMMY_TASKS);

    const filteredTasks = tasks.filter(t => 
        (typeFilter === 'All' || t.type === typeFilter) &&
        (t.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || t.title.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleGradeInput = (id: string, newGrade: string) => {
        setTasks(prev => prev.map(t => {
            if (t.id === id) {
                return { ...t, grade: newGrade, status: newGrade ? 'Dinilai' : 'Menunggu' };
            }
            return t;
        }));
    };

    return (
        <div className="validasi-tugas-page animate-fade-in">
            <header className="page-header">
                <div>
                    <h1 className="page-title">Penilaian Tugas Akademik</h1>
                    <p className="page-subtitle">Modul Dosen untuk validasi Presentasi Kasus, Jurnal, dan Refleksi Koas.</p>
                </div>
                <div className="toolbar">
                    <div className="search-box">
                        <Search size={18} />
                        <input type="text" placeholder="Cari mahasiswa atau judul..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    <select className="filter-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)}>
                        <option value="All">Semua Jenis Tugas</option>
                        <option value="Presentasi Kasus">Presentasi Kasus</option>
                        <option value="Journal Reading">Journal Reading</option>
                        <option value="Refleksi Kasus">Refleksi Kasus</option>
                    </select>
                </div>
            </header>

            <div className="task-grid">
                {filteredTasks.length === 0 ? (
                    <div className="empty-state">Tidak ada tugas yang menunggu penilaian.</div>
                ) : (
                    filteredTasks.map(task => (
                        <div key={task.id} className="task-card">
                            <div className="task-header">
                                <span className={`task-badge ${task.status === 'Menunggu' ? 'waiting' : 'done'}`}>
                                    {task.status === 'Menunggu' ? <Clock size={14}/> : <CheckCircle size={14}/>} {task.status}
                                </span>
                                <span className="task-date">{task.date}</span>
                            </div>
                            
                            <div className="task-body">
                                <div className="task-type">
                                    {task.type === 'Presentasi Kasus' ? <Presentation size={18}/> : <BookOpen size={18}/>}
                                    {task.type} - {task.stase}
                                </div>
                                <h3 className="task-title">{task.title}</h3>
                                <p className="task-student">Oleh: <strong>{task.studentName}</strong></p>
                            </div>

                            <div className="task-footer">
                                <button className="btn-download" onClick={() => alert('Mengunduh ' + task.fileUrl)}>Unduh Berkas</button>
                                <div className="grading-box">
                                    <label>Skor (0-100):</label>
                                    <input 
                                        type="number" 
                                        min="0" max="100" 
                                        placeholder="-" 
                                        value={task.grade || ''} 
                                        onChange={(e) => handleGradeInput(task.id, e.target.value)}
                                        className="grade-input"
                                    />
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ValidasiTugasModule;

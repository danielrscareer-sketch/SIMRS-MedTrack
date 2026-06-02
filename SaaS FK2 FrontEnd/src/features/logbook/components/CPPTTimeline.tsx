import React from 'react';
import { Clock, Activity } from 'lucide-react';
import './CPPTTimeline.css';

interface CPPTRecord {
    id: string;
    tanggal: string;
    waktu: string;
    penulis: string;
    role: string;
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
}

const MOCK_CPPT: CPPTRecord[] = [
    {
        id: '1', tanggal: '15 Okt 2026', waktu: '08:00', penulis: 'Dr. Budi Santoso, Sp.PD', role: 'DPJP',
        subjective: 'Demam berkurang, mual (+)',
        objective: 'TD: 120/80, HR: 88, T: 37.2',
        assessment: 'Dengue Fever H-4',
        plan: 'IVFD RL 20tpm, Paracetamol 3x500mg'
    },
    {
        id: '2', tanggal: '15 Okt 2026', waktu: '14:00', penulis: 'Andi Saputra', role: 'Koas',
        subjective: 'Pasien merasa lebih segar, mual berkurang',
        objective: 'TD: 110/70, HR: 84, T: 36.8',
        assessment: 'Dengue Fever H-4 membaik',
        plan: 'Lapor DPJP, teruskan terapi'
    }
];

const CPPTTimeline: React.FC = () => {
    return (
        <div className="cppt-timeline">
            <h3><Activity size={18} /> Catatan Perkembangan Pasien Terintegrasi (CPPT)</h3>
            <div className="timeline-container">
                {MOCK_CPPT.map(record => (
                    <div key={record.id} className="timeline-item animate-slide-up">
                        <div className="timeline-dot"></div>
                        <div className="timeline-content">
                            <div className="timeline-header">
                                <span className="time"><Clock size={14} /> {record.tanggal} {record.waktu}</span>
                                <span className={`role-badge ${record.role === 'DPJP' ? 'dpjp' : 'koas'}`}>{record.penulis} ({record.role})</span>
                            </div>
                            <div className="soap-grid">
                                <div className="soap-item"><strong>S:</strong> {record.subjective}</div>
                                <div className="soap-item"><strong>O:</strong> {record.objective}</div>
                                <div className="soap-item"><strong>A:</strong> {record.assessment}</div>
                                <div className="soap-item"><strong>P:</strong> {record.plan}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CPPTTimeline;
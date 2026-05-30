import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './features/auth/Login';
import DashboardLayout from './features/dashboard/DashboardLayout';
import DashboardOverview from './features/dashboard/DashboardOverview';
import LogbookModule from './features/logbook/LogbookModule';
import StaseModule from './features/stase/StaseModule';
import TugasModule from './features/tugas/TugasModule';
import ValidasiLogbookModule from './features/dosen/ValidasiLogbookModule';
import ValidasiTugasModule from './features/dosen/ValidasiTugasModule';
import MasterPlottingModule from './features/admin/MasterPlottingModule';
import RekapNilaiModule from './features/admin/RekapNilaiModule';

const App: React.FC = () => {
    return (
        <BrowserRouter>
            <Routes>
                {/* Default Redirect */}
                <Route path="/" element={<Navigate to="/login" replace />} />

                {/* Auth Route */}
                <Route path="/login" element={<Login />} />
                
                {/* Protected Dashboard Routes */}
                <Route path="/dashboard" element={<DashboardLayout />}>
                    <Route index element={<DashboardOverview />} />
                    {/* Mahasiswa Routes */}
                    <Route path="logbook" element={<LogbookModule />} />
                    <Route path="stase" element={<StaseModule />} />
                    <Route path="tugas" element={<TugasModule />} />
                    
                    {/* Dosen Routes */}
                    <Route path="validasi" element={<ValidasiLogbookModule />} />
                    <Route path="penilaian-tugas" element={<ValidasiTugasModule />} />
                    <Route path="bimbingan" element={<div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Modul Mahasiswa Bimbingan (Dosen) — Segera Hadir</div>} />
                    
                    {/* Admin Routes */}
                    <Route path="rekap-nilai" element={<RekapNilaiModule />} />
                    <Route path="master-data" element={<div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Modul Master Data / User (Admin) — Segera Hadir</div>} />
                    <Route path="pengaturan" element={<MasterPlottingModule />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
};

export default App;

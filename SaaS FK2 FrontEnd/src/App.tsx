import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './features/auth/Login';
import DashboardLayout from './features/dashboard/DashboardLayout';
import DashboardOverview from './features/dashboard/DashboardOverview';
import LogbookModule from './features/logbook/LogbookModule';
import StaseModule from './features/stase/StaseModule';
import TugasModule from './features/tugas/TugasModule';
import EvaluasiKlinisModule from './features/stase/EvaluasiKlinisModule';
import JadwalJagaModule from './features/dashboard/JadwalJagaModule';
import ValidasiLogbookModule from './features/dosen/ValidasiLogbookModule';
import ValidasiTugasModule from './features/dosen/ValidasiTugasModule';
import ModulBimbingan from './features/dosen/ModulBimbingan';
import MasterPlottingModule from './features/admin/MasterPlottingModule';
import RekapNilaiModule from './features/admin/RekapNilaiModule';
import MasterDataModule from './features/admin/MasterDataModule';
import CPPTModule from './features/logbook/CPPTModule';
import ReferensiKlinisModule from './features/stase/ReferensiKlinisModule';

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
                    <Route path="cppt" element={<CPPTModule />} />
                    <Route path="stase" element={<StaseModule />} />
                    <Route path="referensi" element={<ReferensiKlinisModule />} />
                    <Route path="tugas" element={<TugasModule />} />
                    <Route path="evaluasi" element={<EvaluasiKlinisModule />} />
                    <Route path="jadwal" element={<JadwalJagaModule />} />
                    
                    {/* Dosen Routes */}
                    <Route path="validasi" element={<ValidasiLogbookModule />} />
                    <Route path="penilaian-tugas" element={<ValidasiTugasModule />} />
                    <Route path="bimbingan" element={<ModulBimbingan />} />
                    
                    {/* Admin Routes */}
                    <Route path="rekap-nilai" element={<RekapNilaiModule />} />
                    <Route path="master-data" element={<MasterDataModule />} />
                    <Route path="pengaturan" element={<MasterPlottingModule />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
};

export default App;

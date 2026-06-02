import React, { useState } from 'react';
import { Search, BookOpen, AlertTriangle, Calculator, FileText, Info } from 'lucide-react';
import './ReferensiKlinisModule.css';

interface Drug {
    id: string;
    name: string;
    category: string;
    indication: string;
    adultDose: string;
    childDoseDoseRate?: number; // mg/kgBB/kali
    childDoseFrequency?: string;
    contraindications: string;
    notes: string;
}

const MOCK_DRUGS: Drug[] = [
    {
        id: '1',
        name: 'Paracetamol',
        category: 'Analgesik & Antipiretik',
        indication: 'Demam, nyeri ringan hingga sedang.',
        adultDose: '500-1000 mg tiap 4-6 jam (Maks: 4g/hari).',
        childDoseDoseRate: 15,
        childDoseFrequency: 'Tiap 6 jam',
        contraindications: 'Gangguan fungsi hati berat, hipersensitivitas.',
        notes: 'Aman untuk lambung. Waspada hepatotoksisitas pada dosis tinggi jangka panjang.'
    },
    {
        id: '2',
        name: 'Amoxicillin',
        category: 'Antibiotik Golongan Penisilin',
        indication: 'Infeksi saluran pernapasan, ISK, infeksi kulit.',
        adultDose: '500 mg tiap 8 jam atau 875 mg tiap 12 jam.',
        childDoseDoseRate: 20,
        childDoseFrequency: 'Tiap 8 jam',
        contraindications: 'Alergi penisilin, infeksi mononukleosis.',
        notes: 'Sering dikombinasikan dengan Asam Klavulanat. Tanyakan riwayat alergi!'
    },
    {
        id: '3',
        name: 'Ibuprofen',
        category: 'NSAID',
        indication: 'Nyeri inflamasi, demam, dismenore.',
        adultDose: '200-400 mg tiap 6-8 jam (Maks: 1.2g/hari).',
        childDoseDoseRate: 10,
        childDoseFrequency: 'Tiap 8 jam',
        contraindications: 'Ulkus peptikum, asma, gagal jantung berat.',
        notes: 'Konsumsi sesudah makan. Hati-hati pada pasien Demam Berdarah Dengue (risiko perdarahan).'
    }
];

const ReferensiKlinisModule: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);
    const [weight, setWeight] = useState<number | ''>(10); // default 10kg

    const filteredDrugs = MOCK_DRUGS.filter(d => 
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        d.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="referensi-klinis-module animate-fade-in">
            <header className="referensi-header">
                <h1 className="page-title"><BookOpen size={28} style={{ display: 'inline', marginRight: '0.5rem', color: 'var(--primary)' }}/> Buku Saku & Obat</h1>
                <p className="page-subtitle">Referensi instan dosis obat, indikasi, dan kalkulator dosis pediatri.</p>
            </header>

            <div className="referensi-layout">
                {/* Panel Kiri: Daftar Obat */}
                <div className="drug-list-panel animate-slide-up">
                    <div className="search-section">
                        <div className="search-input-wrapper">
                            <Search size={18} color="var(--text-secondary)" />
                            <input 
                                type="text" 
                                placeholder="Cari nama obat atau kelas..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="drug-list-container">
                        {filteredDrugs.map(drug => (
                            <div 
                                key={drug.id} 
                                className={`drug-item ${selectedDrug?.id === drug.id ? 'active' : ''}`}
                                onClick={() => setSelectedDrug(drug)}
                            >
                                <div className="drug-name">{drug.name}</div>
                                <span className="drug-category">{drug.category}</span>
                            </div>
                        ))}
                        {filteredDrugs.length === 0 && (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                Obat tidak ditemukan.
                            </div>
                        )}
                    </div>
                </div>

                {/* Panel Kanan: Detail & Kalkulator */}
                <div className="drug-detail-panel animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    {selectedDrug ? (
                        <>
                            <div className="drug-detail-header">
                                <h2 className="drug-detail-title">{selectedDrug.name}</h2>
                                <span className="drug-category">{selectedDrug.category}</span>
                            </div>

                            <h3 className="section-title"><Info size={20} /> Indikasi</h3>
                            <p className="drug-text-content">{selectedDrug.indication}</p>

                            <h3 className="section-title"><FileText size={20} /> Dosis Dewasa</h3>
                            <p className="drug-text-content">{selectedDrug.adultDose}</p>

                            {selectedDrug.childDoseDoseRate && (
                                <>
                                    <h3 className="section-title"><Calculator size={20} /> Kalkulator Dosis Pediatri (Anak)</h3>
                                    <div className="dose-calculator">
                                        <h4>Hitung Dosis Cepat</h4>
                                        <div className="calc-input-group">
                                            <label>Berat Badan Anak (kg):</label>
                                            <input 
                                                type="number" 
                                                min="1" 
                                                value={weight} 
                                                onChange={e => setWeight(Number(e.target.value) || '')} 
                                            />
                                        </div>
                                        <div className="calc-result">
                                            <div className="res-value">
                                                {weight ? (weight * selectedDrug.childDoseDoseRate) : 0} mg
                                            </div>
                                            <div className="res-desc">
                                                Diberikan <strong>{selectedDrug.childDoseFrequency}</strong> <br/>
                                                (Rumus: {selectedDrug.childDoseDoseRate} mg/kgBB/kali)
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="warning-box">
                                <h4><AlertTriangle size={18} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /> Kontraindikasi & Perhatian</h4>
                                <p><strong>Kontraindikasi:</strong> {selectedDrug.contraindications}</p>
                                <p style={{ marginTop: '0.5rem' }}><strong>Catatan Tambahan:</strong> {selectedDrug.notes}</p>
                            </div>
                        </>
                    ) : (
                        <div className="empty-detail">
                            <BookOpen size={64} style={{ color: 'var(--border-color)', marginBottom: '1rem' }} />
                            <h3>Pilih Obat</h3>
                            <p>Pilih obat dari daftar di sebelah kiri untuk melihat rincian dosis, interaksi, dan menggunakan kalkulator pediatri.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReferensiKlinisModule;

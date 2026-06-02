import React, { useState } from 'react';
import { Calculator, X, Activity } from 'lucide-react';
import './MedicalCalculator.css';

interface MedicalCalculatorProps {
    onClose: () => void;
}

const MedicalCalculator: React.FC<MedicalCalculatorProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState<'bmi' | 'egfr'>('bmi');
    const [berat, setBerat] = useState('');
    const [tinggi, setTinggi] = useState('');
    const [umur, setUmur] = useState('');
    const [kreatinin, setKreatinin] = useState('');
    const [gender, setGender] = useState<'L' | 'P'>('L');

    const calculateBMI = () => {
        if (!berat || !tinggi) return null;
        const b = parseFloat(berat);
        const t = parseFloat(tinggi) / 100;
        const bmi = b / (t * t);
        
        let status = 'Normal';
        let colorClass = 'normal';
        if (bmi < 18.5) { status = 'Underweight'; colorClass = 'warning'; }
        else if (bmi >= 25 && bmi < 29.9) { status = 'Overweight'; colorClass = 'warning'; }
        else if (bmi >= 30) { status = 'Obese'; colorClass = 'danger'; }
        
        return { value: bmi.toFixed(1), status, colorClass };
    };

    const calculateEGFR = () => {
        if (!umur || !kreatinin) return null;
        const a = parseFloat(umur);
        const scr = parseFloat(kreatinin);
        let kappa = gender === 'P' ? 0.7 : 0.9;
        let alpha = gender === 'P' ? -0.329 : -0.411;
        
        const min = Math.min(scr / kappa, 1);
        const max = Math.max(scr / kappa, 1);
        
        let egfr = 141 * Math.pow(min, alpha) * Math.pow(max, -1.209) * Math.pow(0.993, a);
        if (gender === 'P') egfr *= 1.018;

        let status = 'Normal';
        let colorClass = 'normal';
        if (egfr < 60 && egfr >= 15) { status = 'CKD (Turun)'; colorClass = 'warning'; }
        else if (egfr < 15) { status = 'Gagal Ginjal'; colorClass = 'danger'; }

        return { value: Math.round(egfr), status, colorClass };
    };

    const bmiResult = calculateBMI();
    const egfrResult = calculateEGFR();

    return (
        <div className="medical-calculator-overlay">
            <div className="medical-calculator-modal animate-slide-up">
                <div className="calc-header">
                    <h3><Calculator size={18} /> Kalkulator Medis</h3>
                    <button className="calc-close" onClick={onClose}><X size={20} /></button>
                </div>
                <div className="calc-body">
                    <div className="calc-tabs">
                        <button className={`calc-tab ${activeTab === 'bmi' ? 'active' : ''}`} onClick={() => setActiveTab('bmi')}>BMI (IMT)</button>
                        <button className={`calc-tab ${activeTab === 'egfr' ? 'active' : ''}`} onClick={() => setActiveTab('egfr')}>eGFR (Ginjal)</button>
                    </div>

                    {activeTab === 'bmi' && (
                        <div className="calc-form animate-fade-in">
                            <div className="form-group">
                                <label>Berat Badan (kg)</label>
                                <input type="number" className="custom-input" placeholder="Contoh: 65" value={berat} onChange={e => setBerat(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Tinggi Badan (cm)</label>
                                <input type="number" className="custom-input" placeholder="Contoh: 170" value={tinggi} onChange={e => setTinggi(e.target.value)} />
                            </div>
                            {bmiResult && (
                                <div className={`calc-result ${bmiResult.colorClass}`}>
                                    <h4>Hasil BMI</h4>
                                    <p>{bmiResult.value}</p>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{bmiResult.status}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'egfr' && (
                        <div className="calc-form animate-fade-in">
                            <div className="form-group">
                                <label>Jenis Kelamin</label>
                                <select className="custom-input" value={gender} onChange={(e: any) => setGender(e.target.value)}>
                                    <option value="L">Laki-laki</option>
                                    <option value="P">Perempuan</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Umur (Tahun)</label>
                                <input type="number" className="custom-input" placeholder="Contoh: 45" value={umur} onChange={e => setUmur(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Serum Kreatinin (mg/dL)</label>
                                <input type="number" step="0.1" className="custom-input" placeholder="Contoh: 1.2" value={kreatinin} onChange={e => setKreatinin(e.target.value)} />
                            </div>
                            {egfrResult && (
                                <div className={`calc-result ${egfrResult.colorClass}`}>
                                    <h4>Estimasi GFR (CKD-EPI)</h4>
                                    <p>{egfrResult.value} <span style={{fontSize:'1rem', fontWeight:'normal'}}>mL/min/1.73m²</span></p>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{egfrResult.status}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MedicalCalculator;
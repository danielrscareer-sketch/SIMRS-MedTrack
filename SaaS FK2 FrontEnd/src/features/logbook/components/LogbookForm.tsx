import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { X, Save, AlertCircle, Upload } from 'lucide-react';

interface LogbookFormProps {
    isOpen: boolean;
    onClose: () => void;
}

const LogbookForm: React.FC<LogbookFormProps> = ({ isOpen, onClose }) => {
    // Basic form state for demonstration
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        stase: 'Ilmu Penyakit Dalam',
        kondisiPasien: 'Stabil',
        triage: 'Kuning (Urgent)',
        skalaNyeri: '0',
        informedConsent: 'Belum / Tidak Perlu',
        diagnosis: '',
        action: '',
        nomorRm: '',
        peran: 'observasi',
        subjectiveDahulu: '',
        subjectiveSekarang: '',
        objKeadaanUmum: '',
        objKesadaran: 'Compos Mentis',
        objTD: '',
        objNadi: '',
        objRR: '',
        objSuhu: '',
        objLainnya: '',
        assesKerja: '',
        assesBanding: '',
        planMedikamentosa: '',
        planNonMedikamentosa: '',
        planSosial: '',
        isJagaMalam: false,
        dokterSpesialis: '',
        dokterUnit: '',
        dokterKonsul: '',
        notes: ''
    });

    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
            return;
        }
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, we would dispatch an action or call an API here.
        console.log('Menyimpan Data Logbook:', formData, 'File:', selectedFile);
        
        // Reset and close
        setFormData({ 
            ...formData, 
            triage: 'Kuning (Urgent)',
            skalaNyeri: '0',
            informedConsent: 'Belum / Tidak Perlu',
            diagnosis: '', 
            action: '', 
            nomorRm: '', 
            subjectiveDahulu: '', 
            subjectiveSekarang: '', 
            objKeadaanUmum: '', 
            objKesadaran: 'Compos Mentis', 
            objTD: '', 
            objNadi: '', 
            objRR: '', 
            objSuhu: '', 
            objLainnya: '', 
            assesKerja: '', 
            assesBanding: '', 
            planMedikamentosa: '', 
            planNonMedikamentosa: '', 
            planSosial: '', 
            isJagaMalam: false,
            dokterSpesialis: '',
            dokterUnit: '',
            dokterKonsul: '',
            notes: '' 
        });
        setSelectedFile(null);
        onClose();
    };

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className={`modal-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} aria-hidden={!isOpen}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Catat Tindakan Baru</h2>
                    <button className="close-btn" onClick={onClose} aria-label="Tutup form">
                        <X size={24} />
                    </button>
                </div>
                
                <form className="modal-body" onSubmit={handleSubmit}>
                    <div className="info-alert" style={{ 
                        background: 'rgba(56, 83, 153, 0.1)', 
                        border: '1px solid var(--primary)', 
                        padding: '1rem', 
                        borderRadius: '8px',
                        display: 'flex',
                        gap: '0.75rem',
                        alignItems: 'flex-start',
                        color: 'var(--primary-light)'
                    }}>
                        <AlertCircle size={20} />
                        <p style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>Pastikan Anda telah mengisi logbook dalam 1x24 jam setelah tindakan dilakukan untuk menghindari penolakan dari supervisor.</p>
                    </div>

                    <div className="form-group">
                        <label>Tanggal / Waktu Tindakan</label>
                        <input type="date" name="date" value={formData.date} onChange={handleChange} required />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Stase / Departemen Aktif</label>
                            <select name="stase" value={formData.stase} onChange={handleChange} required>
                                <option value="Ilmu Penyakit Dalam">Ilmu Penyakit Dalam</option>
                                <option value="Ilmu Bedah">Ilmu Bedah</option>
                                <option value="Ilmu Kesehatan Anak">Ilmu Kesehatan Anak</option>
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
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Kondisi Pasien Tiba</label>
                            <select name="kondisiPasien" value={formData.kondisiPasien} onChange={handleChange} required>
                                <option value="Stabil">Kondisi Stabil</option>
                                <option value="Kritis">Kondisi Kritis (Gawat)</option>
                                <option value="Gawat Darurat">Gawat Darurat (Resusitasi)</option>
                                <option value="Poli Rawat Jalan">Poli Rawat Jalan (Elektif)</option>
                            </select>
                        </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Kategori Triage</label>
                            <select name="triage" value={formData.triage} onChange={handleChange} required>
                                <option value="Merah (Gawat Darurat)">Merah (Gawat Darurat)</option>
                                <option value="Kuning (Urgent)">Kuning (Urgent)</option>
                                <option value="Hijau (Non-Urgent)">Hijau (Non-Urgent)</option>
                                <option value="Hitam (Expectorant)">Hitam (Meninggal)</option>
                            </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Skala Nyeri (VAS)</label>
                            <select name="skalaNyeri" value={formData.skalaNyeri} onChange={handleChange} required>
                                {[...Array(11)].map((_, i) => (
                                    <option key={i} value={i.toString()}>{i} - {i === 0 ? 'Tidak Nyeri' : i < 4 ? 'Ringan' : i < 7 ? 'Sedang' : 'Berat'}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Informed Consent</label>
                            <select name="informedConsent" value={formData.informedConsent} onChange={handleChange} required>
                                <option value="Belum / Tidak Perlu">Belum / Tidak Perlu</option>
                                <option value="Telah Diberikan (Setuju)">Telah Diberikan (Setuju)</option>
                                <option value="Menolak Tindakan">Menolak Tindakan</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Diagnosis ICD-10 (Keluhan Utama)</label>
                        <input 
                            type="text" 
                            name="diagnosis" 
                            placeholder="Contoh: Appendicitis Akut (K35)" 
                            value={formData.diagnosis} 
                            onChange={handleChange} 
                            required 
                        />
                    </div>

                    <div className="form-group">
                        <label>Detail Tindakan Medis</label>
                        <input 
                            type="text" 
                            name="action" 
                            placeholder="Contoh: Asisten 1 Appendectomy" 
                            value={formData.action} 
                            onChange={handleChange} 
                            required 
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Nomor RM Pasien</label>
                            <input 
                                type="text" 
                                name="nomorRm" 
                                placeholder="Misal: RM-102938" 
                                value={formData.nomorRm} 
                                onChange={handleChange} 
                                required 
                            />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Tingkat Keterlibatan</label>
                            <select name="peran" value={formData.peran} onChange={handleChange} required>
                                <option value="observasi">1 - Observasi (Melihat)</option>
                                <option value="asistensi">2 - Asistensi (Membantu)</option>
                                <option value="mandiri">3 - Terlibat Mandiri</option>
                            </select>
                        </div>
                    </div>

                    {/* S - Subjective */}
                    <div className="soap-section">
                        <h4 className="soap-section-title">S - Subjective (Keluhan Keluhan)</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Rincian Penyakit Sekarang</label>
                                <textarea 
                                    name="subjectiveSekarang" rows={3}
                                    placeholder="Keluhan utama saat ini..."
                                    value={formData.subjectiveSekarang} onChange={handleChange} required
                                ></textarea>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Rincian Penyakit Dahulu (Opsional)</label>
                                <textarea 
                                    name="subjectiveDahulu" rows={3}
                                    placeholder="Riwayat penyakit masa lalu, alergi, dsb..."
                                    value={formData.subjectiveDahulu} onChange={handleChange}
                                ></textarea>
                            </div>
                        </div>
                    </div>

                    {/* O - Objective */}
                    <div className="soap-section">
                        <h4 className="soap-section-title">O - Objective (Tanda Vital & Pemeriksaan Fisik)</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Keadaan Umum</label>
                                <input 
                                    type="text" name="objKeadaanUmum" placeholder="Misal: Tampak Lemah, Sakit Sedang"
                                    value={formData.objKeadaanUmum} onChange={handleChange} required
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Tingkat Kesadaran</label>
                                <select name="objKesadaran" value={formData.objKesadaran} onChange={handleChange} required>
                                    <option value="Compos Mentis">Compos Mentis (Sadar Penuh)</option>
                                    <option value="Apatis">Apatis</option>
                                    <option value="Delirium">Delirium</option>
                                    <option value="Somnolen">Somnolen</option>
                                    <option value="Sopor">Sopor</option>
                                    <option value="Coma">Coma</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>TD (mmHg)</label>
                                <input type="text" name="objTD" placeholder="120/80" value={formData.objTD} onChange={handleChange} required />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Nadi (x/m)</label>
                                <input type="text" name="objNadi" placeholder="80" value={formData.objNadi} onChange={handleChange} required />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>RR (x/m)</label>
                                <input type="text" name="objRR" placeholder="20" value={formData.objRR} onChange={handleChange} required />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Suhu (°C)</label>
                                <input type="text" name="objSuhu" placeholder="36.5" value={formData.objSuhu} onChange={handleChange} required />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Pemeriksaan Fisik & Penunjang Lainnya</label>
                            <textarea 
                                name="objLainnya" rows={2}
                                placeholder="Status lokalis, hasil EKG, Lab, dll..."
                                value={formData.objLainnya} onChange={handleChange} required
                            ></textarea>
                        </div>
                    </div>

                    {/* A - Assessment */}
                    <div className="soap-section">
                        <h4 className="soap-section-title">A - Assessment</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Diagnosis Kerja</label>
                                <textarea 
                                    name="assesKerja" rows={2}
                                    placeholder="Diagnosis utama..."
                                    value={formData.assesKerja} onChange={handleChange} required
                                ></textarea>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Diagnosis Banding (Opsional)</label>
                                <textarea 
                                    name="assesBanding" rows={2}
                                    placeholder="Diagnosis banding (DD)..."
                                    value={formData.assesBanding} onChange={handleChange}
                                ></textarea>
                            </div>
                        </div>
                    </div>

                    {/* P - Plan */}
                    <div className="soap-section" style={{ marginBottom: '1.5rem' }}>
                        <h4 className="soap-section-title">P - Plan (Rencana Tatalaksana)</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Tatalaksana Medikamentosa (Obat-obatan)</label>
                                <textarea 
                                    name="planMedikamentosa" rows={2} placeholder="Resep atau terapi farmakologi..."
                                    value={formData.planMedikamentosa} onChange={handleChange} required
                                ></textarea>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Tatalaksana Non-Medikamentosa/Operatif</label>
                                <textarea 
                                    name="planNonMedikamentosa" rows={2} placeholder="Tindakan bedah, pemasangan alat, dll..."
                                    value={formData.planNonMedikamentosa} onChange={handleChange}
                                ></textarea>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Tatalaksana Edukasi / Sosial</label>
                                <textarea 
                                    name="planSosial" rows={2} placeholder="Edukasi pasien, keluarga, pola makan..."
                                    value={formData.planSosial} onChange={handleChange}
                                ></textarea>
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Upload Lampiran / Berkas Dasar (Opsional)</label>
                        <div 
                            style={{ 
                                border: '1px dashed var(--surface-border)', 
                                padding: '1rem', 
                                borderRadius: '8px', 
                                textAlign: 'center',
                                cursor: 'pointer',
                                color: selectedFile ? 'var(--primary)' : 'var(--text-secondary)',
                                background: selectedFile ? 'rgba(35, 64, 142, 0.05)' : 'var(--surface-glass)'
                            }}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload size={20} style={{ marginBottom: '0.5rem' }} />
                            {selectedFile ? (
                                <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>File terpilih: {selectedFile.name}</p>
                            ) : (
                                <p style={{ fontSize: '0.85rem' }}>Klik untuk unggah foto EKG, Lab, atau PDF Kasus (Maks. 5MB)</p>
                            )}
                        </div>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            style={{ display: 'none' }} 
                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                            accept=".pdf,image/*"
                        />
                    </div>

                    {/* Pengawas Medis Tri-Supervisor */}
                    <div style={{ background: 'var(--surface-hover)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid var(--surface-border)' }}>
                        <h4 style={{ marginBottom: '1rem', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span>Validasi Pengawas Medis</span>
                            <label style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'normal', cursor: 'pointer' }}>
                                <input type="checkbox" name="isJagaMalam" checked={formData.isJagaMalam} onChange={handleChange} />
                                Dinas Jaga Malam / CITO
                            </label>
                        </h4>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Dokter Spesialis (DPJP) {formData.isJagaMalam ? '(Jika Ada)' : '*'}</label>
                                <input type="text" name="dokterSpesialis" placeholder="Dr. Budi, Sp.PD" value={formData.dokterSpesialis} onChange={handleChange} required={!formData.isJagaMalam} />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Dokter Jaga Unit / IGD {formData.isJagaMalam ? '*' : ''}</label>
                                <input type="text" name="dokterUnit" placeholder="Dr. Ahmad (Jaga)" value={formData.dokterUnit} onChange={handleChange} required={formData.isJagaMalam} />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Dokter Konsul / Residen</label>
                                <input type="text" name="dokterKonsul" placeholder="Opsional" value={formData.dokterKonsul} onChange={handleChange} />
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Catatan Refleksi Klinis (Opsional)</label>
                        <textarea 
                            name="notes" 
                            placeholder="Tuliskan pengalaman atau kendala yang Anda temui selama tindakan ini berlangsung..."
                            value={formData.notes}
                            onChange={handleChange}
                        ></textarea>
                    </div>
                </form>

                <div className="modal-footer">
                    <button type="button" className="btn-secondary" onClick={onClose}>
                        Batal
                    </button>
                    <button type="button" className="btn-primary" onClick={handleSubmit}>
                        <Save size={18} />
                        Simpan Tindakan
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default LogbookForm;

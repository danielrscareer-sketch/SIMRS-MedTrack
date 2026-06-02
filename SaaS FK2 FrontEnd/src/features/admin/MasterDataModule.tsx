import React, { useState, useEffect } from 'react';
import { Users, Building2, Plus, UserPlus, Search, MapPin, Megaphone, Send, AlertCircle } from 'lucide-react';
import './MasterDataModule.css';

const API_BASE = 'http://127.0.0.1:8000/api';

interface User {
    user_id: string;
    username: string;
    name: string;
    role: string;
    is_active: boolean;
}

const MasterDataModule: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'users' | 'jejaring' | 'broadcast'>('users');
    const [users, setUsers] = useState<User[]>([]);
    const [showUserForm, setShowUserForm] = useState(false);
    
    // User Form State
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        name: '',
        role: 'mahasiswakoas'
    });

    // Broadcast State
    const [broadcastMsg, setBroadcastMsg] = useState('');
    const [broadcastTarget, setBroadcastTarget] = useState('all');
    const [broadcastUrgency, setBroadcastUrgency] = useState('info');
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        if (activeTab === 'users') {
            fetchUsers();
        }
    }, [activeTab]);

    const fetchUsers = async () => {
        try {
            const res = await fetch(`${API_BASE}/admin/users`);
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (error) {
            console.error("Failed to fetch users", error);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE}/admin/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                fetchUsers();
                setShowUserForm(false);
                setFormData({ username: '', password: '', name: '', role: 'mahasiswakoas' });
            } else {
                alert("Gagal menambahkan user. Pastikan username unik.");
            }
        } catch (error) {
            console.error("Error creating user", error);
        }
    };

    const handleBroadcast = (e: React.FormEvent) => {
        e.preventDefault();
        if (!broadcastMsg.trim()) return;
        setIsSending(true);
        setTimeout(() => {
            alert(`Pengumuman berhasil disiarkan ke ${broadcastTarget === 'all' ? 'semua pengguna' : broadcastTarget === 'koas' ? 'mahasiswa koas' : 'dosen / spesialis'}.`);
            setIsSending(false);
            setBroadcastMsg('');
        }, 1200);
    };

    return (
        <div className="master-data-module animate-fade-in">
            <header className="master-header">
                <div>
                    <h1 className="page-title">Master Data & Administrasi</h1>
                    <p className="page-subtitle">Kelola pengguna sistem, rumah sakit jejaring, dan siaran pengumuman (broadcast).</p>
                </div>
            </header>

            <div className="master-tabs">
                <button 
                    className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    <Users size={18} /> Manajemen User
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'jejaring' ? 'active' : ''}`}
                    onClick={() => setActiveTab('jejaring')}
                >
                    <Building2 size={18} /> Rumah Sakit Jejaring
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'broadcast' ? 'active' : ''}`}
                    onClick={() => setActiveTab('broadcast')}
                >
                    <Megaphone size={18} /> Broadcast Pengumuman
                </button>
            </div>

            <div className="master-content">
                {activeTab === 'users' && (
                    <div className="panel animate-slide-up">
                        <div className="panel-header">
                            <div className="search-bar">
                                <Search size={18} color="var(--text-secondary)" />
                                <input type="text" placeholder="Cari nama atau username..." />
                            </div>
                            <button className="btn-primary" onClick={() => setShowUserForm(!showUserForm)}>
                                <UserPlus size={18} /> Tambah User
                            </button>
                        </div>
                        
                        {showUserForm && (
                            <div className="form-card animate-fade-in" style={{marginBottom: '1rem', padding: '1.5rem', background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border-color)'}}>
                                <h3>Buat Pengguna Baru</h3>
                                <form onSubmit={handleCreateUser} className="master-form" style={{display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr', marginTop: '1rem'}}>
                                    <div className="form-group">
                                        <label>Username</label>
                                        <input type="text" className="input-field" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Password</label>
                                        <input type="password" className="input-field" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Nama Lengkap</label>
                                        <input type="text" className="input-field" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Role</label>
                                        <select className="input-field" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} required>
                                            <option value="mahasiswakoas">Mahasiswa Koas</option>
                                            <option value="dosen">Dosen Spesialis</option>
                                            <option value="admin">Admin / TU</option>
                                        </select>
                                    </div>
                                    <div style={{gridColumn: '1 / -1'}}>
                                        <button type="submit" className="btn-primary">Simpan User</button>
                                    </div>
                                </form>
                            </div>
                        )}

                        <div className="table-responsive">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Nama Lengkap</th>
                                        <th>Username</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.length === 0 ? (
                                        <tr><td colSpan={4} style={{textAlign:'center', padding:'2rem'}}>Tidak ada data</td></tr>
                                    ) : (
                                        users.map(u => (
                                            <tr key={u.user_id}>
                                                <td className="font-semibold">{u.name}</td>
                                                <td>{u.username}</td>
                                                <td>
                                                    <span className={`role-badge ${u.role}`}>{u.role}</span>
                                                </td>
                                                <td>
                                                    <span className={`status-badge ${u.is_active ? 'active' : 'inactive'}`}>
                                                        {u.is_active ? 'Aktif' : 'Non-Aktif'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                
                {activeTab === 'jejaring' && (
                    <div className="panel animate-slide-up">
                        <div className="panel-header">
                            <div className="search-bar">
                                <Search size={18} color="var(--text-secondary)" />
                                <input type="text" placeholder="Cari rumah sakit jejaring..." />
                            </div>
                            <button className="btn-primary">
                                <Plus size={18} /> Tambah Jejaring
                            </button>
                        </div>
                        <div className="empty-state" style={{textAlign: 'center', padding: '3rem 1rem'}}>
                            <MapPin size={48} color="var(--text-tertiary)" style={{margin: '0 auto 1rem'}} />
                            <h3 style={{color: 'var(--text-secondary)'}}>Data RS Jejaring belum tersedia</h3>
                            <p style={{color: 'var(--text-tertiary)'}}>Klik Tambah Jejaring untuk mendata rumah sakit afiliasi.</p>
                        </div>
                    </div>
                )}

                {activeTab === 'broadcast' && (
                    <div className="panel animate-slide-up" style={{ padding: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', marginBottom: '2rem' }}>
                            <div style={{ background: 'rgba(237, 27, 36, 0.1)', padding: '1rem', borderRadius: '50%', color: 'var(--primary)' }}>
                                <Megaphone size={32} />
                            </div>
                            <div>
                                <h2 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>Siaran Pengumuman Massal</h2>
                                <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                    Pesan yang Anda kirim akan muncul sebagai pop-up notifikasi darurat (Penting) 
                                    atau di dalam modul Ringkasan Dashboard (Info) seluruh pengguna yang menjadi target.
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleBroadcast} style={{ background: 'var(--bg-color)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Penerima / Target</label>
                                    <select className="input-field" value={broadcastTarget} onChange={e => setBroadcastTarget(e.target.value)}>
                                        <option value="all">Semua Pengguna (Civitas Akademika)</option>
                                        <option value="koas">Hanya Mahasiswa Koas</option>
                                        <option value="dosen">Hanya Dosen / dr. Spesialis</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Tingkat Urgensi</label>
                                    <select className="input-field" value={broadcastUrgency} onChange={e => setBroadcastUrgency(e.target.value)}>
                                        <option value="info">Informasi Umum (Info)</option>
                                        <option value="warning">Peringatan / Batas Waktu (Warning)</option>
                                        <option value="critical">Sangat Penting / Darurat (Critical)</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Isi Pengumuman</label>
                                <textarea 
                                    className="input-field" 
                                    rows={5} 
                                    placeholder="Tulis pesan pengumuman di sini..." 
                                    value={broadcastMsg} 
                                    onChange={e => setBroadcastMsg(e.target.value)}
                                    required
                                    style={{ resize: 'vertical' }}
                                />
                            </div>

                            {broadcastUrgency === 'critical' && (
                                <div style={{ background: '#FEF2F2', borderLeft: '4px solid #EF4444', padding: '1rem', borderRadius: '4px', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', color: '#991B1B' }}>
                                    <AlertCircle size={20} />
                                    <span style={{ fontSize: '0.9rem' }}>Pesan ini akan memaksa pop-up muncul di layar pengguna saat mereka login.</span>
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button type="submit" className="btn-primary" disabled={isSending || !broadcastMsg.trim()} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.75rem 2rem' }}>
                                    {isSending ? 'Mengirim Siaran...' : <><Send size={18} /> Kirim Broadcast</>}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MasterDataModule;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ArrowRight, User, Lock, Eye, EyeOff, GraduationCap, Stethoscope, Briefcase } from 'lucide-react';
import api from '../../lib/api';
import './Login.css';

const Login: React.FC = () => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [role, setRole] = useState('mahasiswakoas'); // Default role
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/api/auth/login', {
                username: identifier,
                password: password,
                role: role
            });
            
            if (response.data.success) {
                // Save the role to local storage so Dashboard knows who is logging in
                localStorage.setItem('userRole', role);
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                
                // Redirect to dashboard
                navigate('/dashboard');
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Terjadi kesalahan saat login.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-wrapper">
            {/* Left Side: Medical Hero Section */}
            <div className={`hero-panel ${isLoaded ? 'animate-slide-up' : 'opacity-0'}`}>
                <div className="hero-content">
                    <div className="brand-header">
                        <div className="brand-logo pulse">
                            <Activity size={40} color="white" />
                        </div>
                        <h1 className="brand-name">MedTrack <span className="light-text">University</span></h1>
                    </div>
                    
                    <h2 className="hero-tagline">
                        Elevating Clinical Education
                    </h2>
                    <p className="hero-desc">
                        Sistem Informasi Manajemen Rumah Sakit khusus Fakultas Kedokteran.
                        Kelola Stase, Log Book, dan Evaluasi dalam satu platform terintegrasi.
                    </p>

                    <div className="hero-stats">
                        <div className="stat-box">
                            <h3 className="stat-number">40+</h3>
                            <p className="stat-label">Departemen Stase</p>
                        </div>
                        <div className="stat-box">
                            <h3 className="stat-number">10k+</h3>
                            <p className="stat-label">Case Tercatat</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="form-panel">
                <div className={`form-card ${isLoaded ? 'animate-slide-up-delay' : 'opacity-0'}`}>
                    <div className="form-header">
                        <h2>Selamat Datang</h2>
                        <p>Masuk ke akun SIMRS Anda berdasarkan peran</p>
                    </div>

                    <form onSubmit={handleLogin} className="login-form">
                        
                        {/* Role Selection */}
                        <div className="role-selector">
                            <label 
                                className={`role-option ${role === 'mahasiswakoas' ? 'selected' : ''}`}
                            >
                                <input 
                                    type="radio" 
                                    name="role" 
                                    value="mahasiswakoas" 
                                    checked={role === 'mahasiswakoas'}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="hidden-radio"
                                />
                                <GraduationCap size={20} />
                                <span>Koas</span>
                            </label>

                            <label 
                                className={`role-option ${role === 'dosen' ? 'selected' : ''}`}
                            >
                                <input 
                                    type="radio" 
                                    name="role" 
                                    value="dosen" 
                                    checked={role === 'dosen'}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="hidden-radio"
                                />
                                <Stethoscope size={20} />
                                <span>Dosen/Dokter</span>
                            </label>

                            <label 
                                className={`role-option ${role === 'admin' ? 'selected' : ''}`}
                            >
                                <input 
                                    type="radio" 
                                    name="role" 
                                    value="admin" 
                                    checked={role === 'admin'}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="hidden-radio"
                                />
                                <Briefcase size={20} />
                                <span>Bagian TU</span>
                            </label>
                        </div>

                        {/* Input Fields */}
                        <div className="form-group">
                            <label className="input-label">Identitas Login {role === 'mahasiswakoas' ? '(NIM)' : '(NIP/Email)'}</label>
                            <div className="input-wrapper">
                                <span className="input-icon">
                                    <User size={20} />
                                </span>
                                <input 
                                    type="text" 
                                    className="custom-input pl-icon" 
                                    placeholder={`Masukkan ${role === 'mahasiswakoas' ? 'NIM' : 'NIP/Email'}`}
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="input-label">Kata Sandi</label>
                            <div className="input-wrapper">
                                <span className="input-icon">
                                    <Lock size={20} />
                                </span>
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    className="custom-input pl-icon pr-icon" 
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button 
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div className="form-options">
                            <label className="checkbox-wrap">
                                <input type="checkbox" className="custom-checkbox" />
                                <span>Ingat Saya</span>
                            </label>
                            <a href="#" className="forgot-link">
                                Lupa sandi?
                            </a>
                        </div>
                        
                        {error && <div className="error-message text-red-500 text-sm mb-4">{error}</div>}

                        <button type="submit" className="submit-btn group" disabled={loading}>
                            {loading ? 'Memproses...' : 'Masuk Sekarang'}
                            {!loading && <ArrowRight size={20} className="arrow-icon" />}
                        </button>
                    </form>

                    <div className="form-footer">
                        <p>
                            Belum memiliki akun? <a href="#">Hubungi Admin FK</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;

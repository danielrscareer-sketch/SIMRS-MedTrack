import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
    Activity, LayoutDashboard, Stethoscope, BookOpen, 
    FileText, UserCircle, LogOut, Menu, Bell, 
    CheckCircle, Users, Settings, ClipboardList, BarChart2
} from 'lucide-react';
import './DashboardLayout.css';

const DashboardLayout: React.FC = () => {
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navigate = useNavigate();

    // Getting the role from local storage or default to Koas if empty (set during Login)
    const userRole = localStorage.getItem('userRole') || 'mahasiswakoas';
    const isDosen = userRole === 'dosen';
    const isAdmin = userRole === 'admin';

    const handleLogout = () => {
        localStorage.removeItem('userRole');
        navigate('/login');
    };

    // Navigation items based on role
    const navItemsKoas = [
        { path: '/dashboard', label: 'Ringkasan', icon: <LayoutDashboard size={22} /> },
        { path: '/dashboard/stase', label: 'Stase / Departemen', icon: <Stethoscope size={22} /> },
        { path: '/dashboard/logbook', label: 'Log Book', icon: <BookOpen size={22} /> },
        { path: '/dashboard/tugas', label: 'Tugas & Evaluasi', icon: <FileText size={22} /> },
    ];

    const navItemsDosen = [
        { path: '/dashboard', label: 'Ringkasan', icon: <LayoutDashboard size={22} /> },
        { path: '/dashboard/validasi', label: 'Validasi Log Book', icon: <CheckCircle size={22} /> },
        { path: '/dashboard/penilaian-tugas', label: 'Penilaian Tugas', icon: <ClipboardList size={22} /> },
        { path: '/dashboard/bimbingan', label: 'Mahasiswa Bimbingan', icon: <Users size={22} /> },
    ];

    const navItemsAdmin = [
        { path: '/dashboard', label: 'Ringkasan', icon: <LayoutDashboard size={22} /> },
        { path: '/dashboard/rekap-nilai', label: 'Rekap Nilai Koas', icon: <BarChart2 size={22} /> },
        { path: '/dashboard/pengaturan', label: 'Plotting Rotasi', icon: <Settings size={22} /> },
        { path: '/dashboard/master-data', label: 'Master Kepegawaian', icon: <Users size={22} /> },
    ];

    const activeNavItems = (() => {
        if (isAdmin) return navItemsAdmin;
        if (isDosen) return navItemsDosen;
        return navItemsKoas;
    })();

    const getRoleDisplayName = () => {
        if (userRole === 'dosen') return 'Dosen / Spesialis';
        if (userRole === 'admin') return 'Admin TU';
        return 'Mahasiswa Klinik';
    };

    const getThemeByRole = (): React.CSSProperties => {
        // Requested Palette: #ed1b24 (Red), #23408e (Dark Blue), #385399 (Lighter Blue), #cccccc (Gray), #ffffff (White)
        switch(userRole) {
            case 'dosen':
                return {
                    '--primary': '#23408e', // Dark Blue
                    '--primary-glow': 'rgba(35, 64, 142, 0.4)',
                    '--primary-light': '#385399',
                    '--accent': '#ed1b24',  // Red alert for dosen grading
                    '--bg-image': "url('/dosen_bg_premium.png')"
                } as React.CSSProperties;
            case 'admin':
                return {
                    '--primary': '#ed1b24', // Red for admin control
                    '--primary-glow': 'rgba(237, 27, 36, 0.4)',
                    '--primary-light': '#ff4c54',
                    '--accent': '#23408e',  // Dark Blue for admin stats
                    '--bg-image': "url('/admin_bg_premium.png')"
                } as React.CSSProperties;
            case 'mahasiswakoas':
            default:
                return {
                    '--primary': '#385399', // Lighter Blue for students
                    '--primary-glow': 'rgba(56, 83, 153, 0.4)',
                    '--primary-light': '#516ebd',
                    '--accent': '#ed1b24',  // Red for student warnings
                    '--bg-image': "url('/medical_bg_premium.png')"
                } as React.CSSProperties;
        }
    };

    return (
        <div className="layout-wrapper" style={getThemeByRole()}>
            
            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div 
                    className="mobile-overlay"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''} ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
                <div className="sidebar-header" onClick={() => navigate('/dashboard')}>
                    <div className="brand">
                        <div className="brand-icon">
                            <Activity size={24} color="white" />
                        </div>
                        {!isSidebarCollapsed && <h1 className="brand-title">MedTrack</h1>}
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {activeNavItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/dashboard'}
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            {!isSidebarCollapsed && <span className="nav-label">{item.label}</span>}
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button className="logout-btn" onClick={handleLogout}>
                        <LogOut size={22} className="logout-icon" />
                        {!isSidebarCollapsed && <span>Keluar</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="main-content">
                <header className="topbar">
                    <div className="topbar-left">
                        {/* Mobile Menu Button */}
                        <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(true)}>
                            <Menu size={24} />
                        </button>

                        {/* Desktop Toggle Button */}
                        <button 
                            className="desktop-menu-btn" 
                            onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
                        >
                            <Menu size={24} />
                        </button>

                        <div className="topbar-title-group">
                            <h2 className="topbar-title">Medical Education System</h2>
                            <p className="topbar-subtitle">Fakultas Kedokteran</p>
                        </div>
                    </div>

                    <div className="topbar-right">
                        <button className="notification-btn">
                            <Bell size={22} />
                            <span className="notification-dot"></span>
                        </button>
                        
                        <div className="topbar-divider"></div>

                        <div className="user-profile">
                            <div className="user-info">
                                <p className="user-name">Pengguna Aktif</p>
                                <p className="user-role">{getRoleDisplayName()}</p>
                            </div>
                            <div className="user-avatar">
                                <UserCircle size={24} />
                            </div>
                        </div>
                    </div>
                </header>

                <div className="content-scroll-area">
                    {/* Max width container to center content instead of full width */}
                    <div className="content-container">
                        <Outlet />
                    </div>
                </div>

                {/* Floating Global Widgets */}
                <div className="global-widgets-container">
                    <button 
                        className="fab-btn" 
                        title="Tindakan Cepat / Tambah"
                        onClick={() => {
                            if (isAdmin) navigate('/dashboard/master-data');
                            else if (isDosen) navigate('/dashboard/validasi');
                            else navigate('/dashboard/logbook');
                        }}
                    >
                        <div className="fab-icon-wrapper">
                            <div className="fab-cross-vertical"></div>
                            <div className="fab-cross-horizontal"></div>
                        </div>
                    </button>
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;

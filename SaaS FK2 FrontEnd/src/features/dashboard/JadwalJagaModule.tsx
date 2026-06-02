import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, Search, ChevronLeft, ChevronRight, List } from 'lucide-react';
import './JadwalJagaModule.css';

interface Shift {
    id: string;
    tanggal: string; // YYYY-MM-DD
    day: number;
    shift: 'Pagi' | 'Siang' | 'Malam';
    lokasi: string;
    stase: string;
}

const MOCK_SHIFTS: Shift[] = [
    { id: '1', tanggal: '2026-10-01', day: 1, shift: 'Pagi', lokasi: 'Bangsal Anak', stase: 'Ilmu Kesehatan Anak' },
    { id: '2', tanggal: '2026-10-02', day: 2, shift: 'Malam', lokasi: 'IGD', stase: 'Ilmu Kesehatan Anak' },
    { id: '3', tanggal: '2026-10-05', day: 5, shift: 'Siang', lokasi: 'Poliklinik', stase: 'Ilmu Kesehatan Anak' },
    { id: '4', tanggal: '2026-10-15', day: 15, shift: 'Malam', lokasi: 'IGD', stase: 'Ilmu Penyakit Dalam' },
    { id: '5', tanggal: '2026-10-18', day: 18, shift: 'Pagi', lokasi: 'Bangsal Teratai', stase: 'Ilmu Penyakit Dalam' },
    { id: '6', tanggal: '2026-10-22', day: 22, shift: 'Malam', lokasi: 'IGD', stase: 'Ilmu Penyakit Dalam' },
];

const JadwalJagaModule: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const daysInMonth = 31; // Mock Oktober
    const firstDayOffset = 4; // Mock Kamis 1 Oktober

    // Generate Calendar Cells
    const calendarCells = [];
    for (let i = 0; i < firstDayOffset; i++) {
        calendarCells.push(<div key={`empty-${i}`} className="calendar-cell empty-cell"></div>);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
        const shiftsForDay = MOCK_SHIFTS.filter(s => s.day === day);
        const isToday = day === 15; // Mock today

        calendarCells.push(
            <div key={`day-${day}`} className={`calendar-cell ${isToday ? 'today' : ''}`}>
                <span className="date-number">{day}</span>
                {shiftsForDay.map(shift => (
                    <div key={shift.id} className={`shift-chip shift-${shift.shift.toLowerCase()}`} title={`${shift.lokasi} - ${shift.stase}`}>
                        {shift.shift}
                    </div>
                ))}
            </div>
        );
    }

    const upcomingShifts = MOCK_SHIFTS.filter(s => s.day >= 15).slice(0, 3); // Dari tanggal 15 ke depan

    return (
        <div className="jadwal-jaga-module animate-fade-in">
            <header className="jadwal-header">
                <div>
                    <h1 className="page-title"><CalendarIcon size={28} style={{ display: 'inline', marginRight: '0.5rem', color: 'var(--primary)' }}/> Jadwal Dinas & Jaga</h1>
                    <p className="page-subtitle">Pantau jadwal rotasi stase dan shift jaga malam Anda di rumah sakit jejaring.</p>
                </div>
                <div className="search-bar" style={{ minWidth: '250px' }}>
                    <Search size={18} color="var(--text-secondary)" />
                    <input type="text" placeholder="Cari lokasi dinas..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: '100%', outline: 'none', border: 'none', background: 'transparent' }} />
                </div>
            </header>

            <div className="jadwal-layout">
                {/* Left: Calendar View */}
                <div className="calendar-panel animate-slide-up">
                    <div className="calendar-header">
                        <h3>Oktober 2026</h3>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn-secondary" style={{ padding: '0.4rem' }}><ChevronLeft size={18}/></button>
                            <button className="btn-primary" style={{ padding: '0.4rem 1rem' }}>Bulan Ini</button>
                            <button className="btn-secondary" style={{ padding: '0.4rem' }}><ChevronRight size={18}/></button>
                        </div>
                    </div>
                    
                    <div className="calendar-grid">
                        <div className="calendar-day-header">Min</div>
                        <div className="calendar-day-header">Sen</div>
                        <div className="calendar-day-header">Sel</div>
                        <div className="calendar-day-header">Rab</div>
                        <div className="calendar-day-header">Kam</div>
                        <div className="calendar-day-header">Jum</div>
                        <div className="calendar-day-header">Sab</div>
                        {calendarCells}
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '4px', background: 'linear-gradient(135deg, #10B981, #059669)' }}></span> Pagi (08:00 - 14:00)</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '4px', background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}></span> Siang (14:00 - 20:00)</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '4px', background: 'linear-gradient(135deg, #1E1B4B, #312E81)' }}></span> Malam (20:00 - 08:00)</div>
                    </div>
                </div>

                {/* Right: Upcoming Shifts List */}
                <div className="upcoming-panel animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <h3><List size={20} /> Jadwal Mendatang</h3>
                    
                    <div className="shift-list">
                        {upcomingShifts.map((shift, idx) => (
                            <div key={shift.id} className="shift-item" style={{ borderColor: idx === 0 ? 'var(--primary)' : 'var(--border-color)', boxShadow: idx === 0 ? '0 4px 12px rgba(35,64,142,0.08)' : 'none' }}>
                                <div className="shift-item-date">
                                    <span className="day">{
                                        ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][(firstDayOffset + shift.day - 1) % 7]
                                    }</span>
                                    <span className="num">{shift.day}</span>
                                </div>
                                <div className="shift-item-details">
                                    <h4>{shift.stase}</h4>
                                    <div className="shift-meta">
                                        <Clock size={14} /> 
                                        <span style={{ fontWeight: 600, color: shift.shift === 'Malam' ? '#312E81' : shift.shift === 'Pagi' ? '#059669' : '#D97706' }}>
                                            Shift {shift.shift}
                                        </span>
                                    </div>
                                    <div className="shift-meta">
                                        <MapPin size={14} /> {shift.lokasi}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JadwalJagaModule;
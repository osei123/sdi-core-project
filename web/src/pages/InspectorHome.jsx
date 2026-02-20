import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Shield,
    PlayCircle,
    Clock,
    ChevronRight,
    User,
    Settings,
    Moon,
    Sun,
    LogOut,
    Trash2,
    LayoutDashboard,
    Flame,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../components/Toast';

const InspectorHome = ({ appLogic }) => {
    const { colors, isDarkMode, toggleTheme } = useTheme();
    const toast = useToast();
    const navigate = useNavigate();
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);

    const userName = appLogic.profile?.full_name || 'Inspector';
    const recentHistory = appLogic.historyData.slice(0, 5);

    // Close menu on outside click
    useEffect(() => {
        const handler = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    // Calculate streak
    const getStreak = () => {
        if (!appLogic.historyData.length) return 0;
        let streak = 0;
        const today = new Date();
        for (let i = 0; i < 30; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(checkDate.getDate() - i);
            const dateStr = checkDate.toLocaleDateString();
            const hasInspection = appLogic.historyData.some((h) => {
                const hDate = new Date(h.timestamp).toLocaleDateString();
                return hDate === dateStr;
            });
            if (hasInspection) streak++;
            else if (i > 0) break;
        }
        return streak;
    };

    const streak = getStreak();

    const getStatusColor = (status) => {
        if (status === 'GROUNDED') return '#dc2626';
        if (status === 'MONITOR') return '#facc15';
        return '#22c55e';
    };

    const handleLogout = async () => {
        await appLogic.logout();
        navigate('/');
    };

    const handleDeleteAccount = async () => {
        if (window.confirm('Are you sure you want to delete your account? This cannot be undone.')) {
            try {
                await appLogic.deleteAccount();
                toast('Account deleted', 'info');
                navigate('/');
            } catch (err) {
                toast(err.message || 'Failed to delete account', 'error');
            }
        }
    };

    return (
        <div style={{ padding: 0 }}>
            {/* Header */}
            <div className="page-header">
                <div className="title-area">
                    <p className="subtitle">SDI CORE INSPECTION</p>
                    <h1>{getGreeting()}, {userName.split(' ')[0]}</h1>
                </div>
                <div ref={menuRef} style={{ position: 'relative' }}>
                    <div className="avatar" onClick={() => setShowMenu(!showMenu)}>
                        <User size={20} />
                    </div>
                    {showMenu && (
                        <div className="settings-dropdown">
                            <button className="menu-item" onClick={() => { setShowMenu(false); navigate('/profile'); }}>
                                <User size={16} /> Edit Profile
                            </button>
                            <button className="menu-item" onClick={() => { toggleTheme(); setShowMenu(false); }}>
                                {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                                {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                            </button>
                            {appLogic.role === 'manager' && (
                                <button className="menu-item" onClick={() => { setShowMenu(false); navigate('/manager'); }}>
                                    <LayoutDashboard size={16} /> Manager Dashboard
                                </button>
                            )}
                            <div className="divider" />
                            <button className="menu-item" onClick={handleLogout}>
                                <LogOut size={16} /> Sign Out
                            </button>
                            <button className="menu-item danger" onClick={handleDeleteAccount}>
                                <Trash2 size={16} /> Delete Account
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div style={{ padding: '24px' }}>
                {/* Streak Badge */}
                {streak > 0 && (
                    <div className="streak-badge">
                        <Flame size={18} color="#facc15" />
                        {streak} Day Inspection Streak!
                    </div>
                )}

                {/* Start Inspection Button */}
                <div className="start-button-container">
                    <button className="start-button" onClick={() => navigate('/inspect')}>
                        <PlayCircle size={48} color="#fff" />
                        <span className="label">START</span>
                        <span className="sub">INSPECTION</span>
                    </button>
                </div>

                {/* Recent History */}
                <div style={{ marginTop: 16 }}>
                    <div
                        className="section-title"
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                        <span>RECENT INSPECTIONS</span>
                        {appLogic.historyData.length > 0 && (
                            <button
                                className="btn-ghost"
                                onClick={() => navigate('/history')}
                                style={{ fontSize: 11 }}
                            >
                                View All →
                            </button>
                        )}
                    </div>

                    {recentHistory.length === 0 ? (
                        <div className="empty-state">
                            <Clock size={40} className="icon" />
                            <p className="text">No inspections yet. Start your first one!</p>
                        </div>
                    ) : (
                        recentHistory.map((item) => (
                            <div
                                key={item.id}
                                className="history-item"
                                onClick={() => navigate(`/details/${item.id}`)}
                            >
                                <div className="info">
                                    <div className="truck">{item.truck}</div>
                                    <div className="date">{item.timestamp}</div>
                                    <div className="status-text" style={{ color: getStatusColor(item.status) }}>
                                        {item.status === 'GROUNDED'
                                            ? 'UNSAFE - GROUNDED'
                                            : item.status === 'MONITOR'
                                                ? 'SAFE - MONITOR'
                                                : 'CLEAN - OPERATIONAL'}
                                    </div>
                                </div>
                                <ChevronRight size={18} color="var(--text-muted)" />
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default InspectorHome;

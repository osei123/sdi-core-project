import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Clock, Droplets } from 'lucide-react';

const BottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const path = location.pathname;

    const tabs = [
        { label: 'Home', icon: Home, path: '/home' },
        { label: 'History', icon: Clock, path: '/history' },
        { label: 'Quality', icon: Droplets, path: '/quality' },
    ];

    // Don't show nav on auth pages or during inspection flow
    const hiddenPaths = ['/', '/signup', '/forgot-password', '/checklist', '/summary'];
    if (hiddenPaths.includes(path)) return null;

    return (
        <nav className="bottom-nav">
            {tabs.map((tab) => (
                <button
                    key={tab.path}
                    className={`nav-item ${path === tab.path ? 'active' : ''}`}
                    onClick={() => navigate(tab.path)}
                >
                    <tab.icon size={20} />
                    <span>{tab.label}</span>
                </button>
            ))}
        </nav>
    );
};

export default BottomNav;

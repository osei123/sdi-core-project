import React, { createContext, useContext, useState, useEffect } from 'react';

const darkTheme = {
    bgPrimary: '#0a0a0a',
    bgSecondary: '#121212',
    bgTertiary: '#1a1a1a',
    textPrimary: '#ffffff',
    textSecondary: '#d1d5db',
    textMuted: '#9ca3af',
    border: '#27272a',
    card: '#121212',
    tealDark: '#134e4a',
    tealMid: '#0f766e',
    tealLight: '#99f6e4',
    green: '#22c55e',
    red: '#dc2626',
    yellow: '#facc15',
    blue: '#2563eb',
    gray: '#9ca3af',
    grayDark: '#1f2937',
    white: '#ffffff',
};

const lightTheme = {
    bgPrimary: '#f8fafc',
    bgSecondary: '#ffffff',
    bgTertiary: '#f1f5f9',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#94a3b8',
    border: '#e2e8f0',
    card: '#ffffff',
    tealDark: '#134e4a',
    tealMid: '#0f766e',
    tealLight: '#0d9488',
    green: '#16a34a',
    red: '#dc2626',
    yellow: '#ca8a04',
    blue: '#2563eb',
    gray: '#64748b',
    grayDark: '#334155',
    white: '#ffffff',
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('sdi-theme');
        return saved !== null ? saved === 'dark' : true;
    });

    useEffect(() => {
        localStorage.setItem('sdi-theme', isDarkMode ? 'dark' : 'light');
        document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    }, [isDarkMode]);

    const toggleTheme = () => setIsDarkMode((prev) => !prev);
    const colors = isDarkMode ? darkTheme : lightTheme;

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleTheme, colors }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within a ThemeProvider');
    return context;
};

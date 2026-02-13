import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define color palettes for both themes
export const DARK_COLORS = {
    // Backgrounds
    bgPrimary: '#0a0a0a',      // Ultra Dark Background
    bgSecondary: '#121212',    // Card Background
    bgTertiary: '#1a1a1a',     // Elevated surfaces

    // Teal accent family
    tealDark: '#134e4a',
    tealMid: '#0f766e',
    tealLight: '#99f6e4',

    // Semantic colors
    green: '#22c55e',
    red: '#dc2626',
    yellow: '#facc15',
    blue: '#2563eb',

    // Neutrals
    textPrimary: '#ffffff',
    textSecondary: '#9ca3af',
    textMuted: '#6b7280',
    border: '#27272a',
    borderLight: '#3f3f46',

    // Keep legacy names for compatibility
    bgDark: '#0a0a0a',
    card: '#121212',
    gray: '#9ca3af',
    grayDark: '#1f2937',
    white: '#ffffff',
};

export const LIGHT_COLORS = {
    // Backgrounds
    bgPrimary: '#f5f5f5',      // Light gray background
    bgSecondary: '#ffffff',    // Card Background (white)
    bgTertiary: '#fafafa',     // Elevated surfaces

    // Teal accent family (slightly darker for light mode)
    tealDark: '#0d9488',
    tealMid: '#14b8a6',
    tealLight: '#134e4a',

    // Semantic colors
    green: '#16a34a',
    red: '#dc2626',
    yellow: '#ca8a04',
    blue: '#2563eb',

    // Neutrals
    textPrimary: '#0a0a0a',
    textSecondary: '#4b5563',
    textMuted: '#9ca3af',
    border: '#e5e5e5',
    borderLight: '#d4d4d4',

    // Keep legacy names for compatibility
    bgDark: '#f5f5f5',
    card: '#ffffff',
    gray: '#6b7280',
    grayDark: '#e5e7eb',
    white: '#0a0a0a',  // Inverted for text
};

const ThemeContext = createContext();

const THEME_STORAGE_KEY = '@sdi_core_theme';

export const ThemeProvider = ({ children }) => {
    const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark mode

    // Load saved theme preference on mount
    useEffect(() => {
        const loadTheme = async () => {
            try {
                const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
                if (savedTheme !== null) {
                    setIsDarkMode(savedTheme === 'dark');
                }
            } catch (e) {
                console.log('Error loading theme preference:', e);
            }
        };
        loadTheme();
    }, []);

    // Toggle theme and persist preference
    const toggleTheme = async () => {
        try {
            const newTheme = !isDarkMode;
            setIsDarkMode(newTheme);
            await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme ? 'dark' : 'light');
        } catch (e) {
            console.log('Error saving theme preference:', e);
        }
    };

    // Get current color palette
    const colors = isDarkMode ? DARK_COLORS : LIGHT_COLORS;

    // Theme object with utility values
    const theme = {
        isDarkMode,
        colors,
        // Computed values for common patterns
        statusBarStyle: isDarkMode ? 'light-content' : 'dark-content',
    };

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme, colors }}>
            {children}
        </ThemeContext.Provider>
    );
};

// Hook for consuming theme
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export default ThemeContext;

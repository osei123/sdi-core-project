import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    RefreshControl,
    Modal,
    Alert,
} from 'react-native';
import {
    User,
    Zap,
    Play,
    CheckCircle,
    XCircle,
    Lock,
    Shield,
    LogOut,
    Trash,
    Sun,
    Moon,
} from 'lucide-react-native';
import { styles } from '../styles/globalStyles';
import { COLORS } from '../constants/colors';
import { useTheme } from '../contexts/ThemeContext';

const InspectorHomeScreen = ({
    onStart,
    userName,
    realRole, // <--- ADD THIS
    historyData,
    onViewItem,
    onLogout,
    onDeleteAccount,
    onSwitchToManager,
    onEditProfile,
    onRefresh, // <--- ADD THIS
}) => {
    const { isDarkMode, toggleTheme, colors } = useTheme();
    const [menuVisible, setMenuVisible] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const recentItems = historyData ? historyData.slice(0, 3) : [];

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        if (onRefresh) {
            await onRefresh();
        }
        setRefreshing(false);
    }, [onRefresh]);

    // 1. GREETING LOGIC
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    // 2. NEW: STREAK CALCULATION LOGIC
    const calculateStreak = (history) => {
        if (!history || history.length === 0) return 0;
        // Get unique dates (e.g., "12/8/2025") from history
        const uniqueDates = [
            ...new Set(history.map((item) => item.timestamp.split(',')[0].trim())),
        ];
        return uniqueDates.length; // Returns total number of days active
    };

    const currentStreak = calculateStreak(historyData);

    const MenuItem = ({ icon: Icon, label, color, onPress }) => {
        // Default color to textPrimary if not provided
        const finalColor = color || colors.textPrimary;

        return (
            <TouchableOpacity
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.borderLight, // Use theme border
                }}
                onPress={onPress}>
                <View style={{ width: 40, alignItems: 'center' }}>
                    <Icon size={22} color={finalColor} />
                </View>
                <Text style={{ color: finalColor, fontSize: 16, fontWeight: '500' }}>
                    {label}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.screenBase, { backgroundColor: colors.bgPrimary }]}>
            <View style={[styles.header, { backgroundColor: colors.bgSecondary, borderBottomColor: colors.border }]}>
                <View style={{ flex: 1, marginRight: 15 }}>
                    <Text style={[styles.headerSub, { color: colors.textMuted }]}>SDI CORE</Text>
                    <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                        {getGreeting()}, {userName}
                    </Text>
                </View>

                <TouchableOpacity
                    style={[styles.avatar, { backgroundColor: colors.bgTertiary, borderColor: colors.border }]}
                    onPress={() => setMenuVisible(true)}>
                    <User size={20} color={colors.textPrimary} />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={colors.tealLight}
                    />
                }
            >
                {/* --- DYNAMIC STREAK BADGE START --- */}
                <View
                    style={[
                        styles.streakBadge,
                        {
                            backgroundColor:
                                currentStreak >= 7
                                    ? 'rgba(234, 179, 8, 0.2)'
                                    : isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                            borderColor: currentStreak >= 7 ? colors.yellow : colors.border,
                        },
                    ]}>
                    <Zap
                        size={16}
                        color={
                            currentStreak >= 7
                                ? colors.yellow
                                : currentStreak > 0
                                    ? colors.blue
                                    : colors.textMuted
                        }
                        fill={currentStreak >= 7 ? colors.yellow : 'transparent'}
                        style={{ marginRight: 8 }}
                    />
                    <Text
                        style={{
                            color: currentStreak >= 7 ? colors.yellow : colors.textPrimary,
                            fontWeight: '600',
                        }}>
                        {currentStreak > 0
                            ? `${currentStreak}-Day Active Streak!`
                            : 'No streak yet. Start today!'}
                    </Text>
                </View>
                {/* --- DYNAMIC STREAK BADGE END --- */}

                <View style={{ alignItems: 'center', marginBottom: 32 }}>
                    <TouchableOpacity style={[styles.startButton, { backgroundColor: colors.blue, borderColor: `${colors.blue}50` }]} onPress={onStart}>
                        <Play
                            size={40}
                            color="#fff"
                            fill="#fff"
                            style={{ marginLeft: 4 }}
                        />
                        <Text style={[styles.startButtonText, { color: '#fff' }]}>START</Text>
                        <Text style={[styles.startButtonSub, { color: 'rgba(255,255,255,0.7)' }]}>INSPECTION</Text>
                    </TouchableOpacity>
                </View>

                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>RECENT HISTORY</Text>
                {recentItems.length === 0 ? (
                    <Text style={{ color: colors.textMuted, fontStyle: 'italic' }}>
                        No recent inspections.
                    </Text>
                ) : (
                    recentItems.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={[styles.historyItem, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}
                            onPress={() => onViewItem(item)}>
                            <View>
                                <Text style={[styles.historyTitle, { color: colors.textPrimary }]}>{item.truck}</Text>
                                <Text style={[styles.historyDate, { color: colors.textMuted }]}>{item.timestamp}</Text>
                            </View>
                            {item.status === 'PASS' ? (
                                <CheckCircle size={24} color={colors.green} />
                            ) : (
                                <XCircle size={24} color={colors.red} />
                            )}
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>

            {/* SETTINGS MENU (Pop-up) */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={menuVisible}
                onRequestClose={() => setMenuVisible(false)}>
                <TouchableOpacity
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(0,0,0,0.85)',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                    onPress={() => setMenuVisible(false)}
                    activeOpacity={1}>
                    <View
                        style={{
                            backgroundColor: colors.bgSecondary,
                            width: '85%',
                            maxWidth: 400,
                            borderRadius: 24,
                            padding: 24,
                            borderWidth: 1,
                            borderColor: colors.border,
                            elevation: 20,
                        }}>
                        <View style={{ alignItems: 'center', marginBottom: 20 }}>
                            <View
                                style={{
                                    width: 60,
                                    height: 60,
                                    borderRadius: 30,
                                    backgroundColor: colors.bgTertiary,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: 10,
                                }}>
                                <User size={30} color={colors.tealLight} />
                            </View>
                            <Text
                                style={{
                                    color: colors.textPrimary,
                                    fontWeight: 'bold',
                                    fontSize: 18,
                                }}>
                                User Settings
                            </Text>
                            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                                {userName}
                            </Text>
                        </View>
                        <MenuItem
                            icon={User}
                            label="Update User Details"
                            onPress={() => {
                                setMenuVisible(false);
                                onEditProfile();
                            }}
                        />
                        <MenuItem
                            icon={Lock}
                            label="Change Password"
                            onPress={() =>
                                Alert.alert('Security', 'Password reset link sent.')
                            }
                        />
                        <MenuItem
                            icon={isDarkMode ? Sun : Moon}
                            label={isDarkMode ? 'Light Mode' : 'Dark Mode'}
                            color={COLORS.yellow}
                            onPress={toggleTheme}
                        />
                        {/* SECURITY CHECK: Only show if user is REALLY a manager */}
                        {realRole === 'manager' && (
                            <MenuItem
                                icon={Shield}
                                label="Manager Dashboard"
                                color={COLORS.blue}
                                onPress={() => {
                                    setMenuVisible(false);
                                    onSwitchToManager();
                                }}
                            />
                        )}
                        <View style={{ height: 15 }} />
                        <MenuItem
                            icon={LogOut}
                            label="Log Out"
                            color={COLORS.yellow}
                            onPress={() => {
                                setMenuVisible(false);
                                onLogout();
                            }}
                        />
                        <MenuItem
                            icon={Trash}
                            label="Delete Account"
                            color={COLORS.red}
                            onPress={() => {
                                setMenuVisible(false);
                                onDeleteAccount();
                            }}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

export default InspectorHomeScreen;

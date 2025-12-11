import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
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
} from 'lucide-react-native';
import { styles } from '../styles/globalStyles';
import { COLORS } from '../constants/colors';

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
}) => {
    const [menuVisible, setMenuVisible] = useState(false);
    const recentItems = historyData ? historyData.slice(0, 3) : [];

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

    const MenuItem = ({ icon: Icon, label, color = COLORS.white, onPress }) => (
        <TouchableOpacity
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: '#2a2a2a',
            }}
            onPress={onPress}>
            <View style={{ width: 40, alignItems: 'center' }}>
                <Icon size={22} color={color} />
            </View>
            <Text style={{ color: color, fontSize: 16, fontWeight: '500' }}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.screenBase}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerSub}>SDI CORE</Text>
                    <Text style={styles.headerTitle}>
                        {getGreeting()}, {userName}
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.avatar}
                    onPress={() => setMenuVisible(true)}>
                    <User size={20} color={COLORS.white} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
                {/* --- DYNAMIC STREAK BADGE START --- */}
                <View
                    style={[
                        styles.streakBadge,
                        {
                            // If streak is 7 or more, background is Gold. Otherwise transparent.
                            backgroundColor:
                                currentStreak >= 7
                                    ? 'rgba(234, 179, 8, 0.2)'
                                    : 'rgba(255, 255, 255, 0.1)',
                            borderColor: currentStreak >= 7 ? COLORS.yellow : COLORS.gray,
                        },
                    ]}>
                    <Zap
                        size={16}
                        // If streak is 7+, Icon is Gold. Otherwise Blue/Gray.
                        color={
                            currentStreak >= 7
                                ? COLORS.yellow
                                : currentStreak > 0
                                    ? COLORS.blue
                                    : COLORS.gray
                        }
                        fill={currentStreak >= 7 ? COLORS.yellow : 'transparent'}
                        style={{ marginRight: 8 }}
                    />
                    <Text
                        style={{
                            color: currentStreak >= 7 ? COLORS.yellow : COLORS.white,
                            fontWeight: '600',
                        }}>
                        {currentStreak > 0
                            ? `${currentStreak}-Day Active Streak!`
                            : 'No streak yet. Start today!'}
                    </Text>
                </View>
                {/* --- DYNAMIC STREAK BADGE END --- */}

                <View style={{ alignItems: 'center', marginBottom: 32 }}>
                    <TouchableOpacity style={styles.startButton} onPress={onStart}>
                        <Play
                            size={40}
                            color={COLORS.white}
                            fill={COLORS.white}
                            style={{ marginLeft: 4 }}
                        />
                        <Text style={styles.startButtonText}>START</Text>
                        <Text style={styles.startButtonSub}>INSPECTION</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.sectionTitle}>RECENT HISTORY</Text>
                {recentItems.length === 0 ? (
                    <Text style={{ color: COLORS.gray, fontStyle: 'italic' }}>
                        No recent inspections.
                    </Text>
                ) : (
                    recentItems.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.historyItem}
                            onPress={() => onViewItem(item)}>
                            <View>
                                <Text style={styles.historyTitle}>{item.truck}</Text>
                                <Text style={styles.historyDate}>{item.timestamp}</Text>
                            </View>
                            {item.status === 'PASS' ? (
                                <CheckCircle size={24} color={COLORS.green} />
                            ) : (
                                <XCircle size={24} color={COLORS.red} />
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
                            backgroundColor: '#1a1a1a',
                            width: '85%',
                            maxWidth: 400,
                            borderRadius: 24,
                            padding: 24,
                            borderWidth: 1,
                            borderColor: COLORS.grayDark,
                            elevation: 20,
                        }}>
                        <View style={{ alignItems: 'center', marginBottom: 20 }}>
                            <View
                                style={{
                                    width: 60,
                                    height: 60,
                                    borderRadius: 30,
                                    backgroundColor: COLORS.grayDark,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: 10,
                                }}>
                                <User size={30} color={COLORS.tealLight} />
                            </View>
                            <Text
                                style={{
                                    color: COLORS.white,
                                    fontWeight: 'bold',
                                    fontSize: 18,
                                }}>
                                User Settings
                            </Text>
                            <Text style={{ color: COLORS.gray, fontSize: 12 }}>
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

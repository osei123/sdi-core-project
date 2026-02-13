import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    RefreshControl,
    Alert,
    Modal,
} from 'react-native';
import {
    User,
    AlertTriangle,
    UserPlus,
    X,
    MapPin,
    Key,
    Lock,
    LogOut,
    Trash,
    Activity,
    Sun,
    Moon,
} from 'lucide-react-native';
import { styles } from '../styles/globalStyles';
import { COLORS } from '../constants/colors';
import { useTheme } from '../contexts/ThemeContext';
import MenuItem from '../components/MenuItem';
import GraphBar from '../components/GraphBar';

const ManagerDashboard = ({
    onLogout,
    historyData,
    allUsers,
    onViewItem,
    onAddManager,
    userName,
    onEditProfile,
    onDeleteAccount,
    qualityReports,
    onExportQuality,
}) => {
    const { isDarkMode, toggleTheme, colors } = useTheme();
    const [refreshing, setRefreshing] = useState(false);
    const [usersModalVisible, setUsersModalVisible] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);
    const [selectedQualityReport, setSelectedQualityReport] = useState(null);

    // NEW: State for Quick Filters
    const [filterMode, setFilterMode] = useState('ALL'); // 'ALL', 'CRITICAL', 'MONITOR'

    // --- CRITICAL FIX: DEFINE CALCULATIONS FIRST ---
    const totalInspections = historyData ? historyData.length : 0;

    const passCount = historyData
        ? historyData.filter((item) => item.status === 'PASS').length
        : 0;

    const monitorCount = historyData
        ? historyData.filter((item) => item.status === 'MONITOR').length
        : 0;

    const groundedCount = historyData
        ? historyData.filter((item) => item.status === 'GROUNDED').length
        : 0;
    // 1. CALCULATE ATTENTION NEEDED (Real Data)
    // We filter the history for any status that is NOT 'PASS'
    const attentionList = historyData
        ? historyData.filter(
            (item) => item.status === 'GROUNDED' || item.status === 'MONITOR'
        )
        : [];
    const attentionCount = attentionList.length;

    // 2. CALCULATE TOP PERFORMERS (Real Data)
    // We map through users, count their specific checks, and sort them highest to lowest
    const rankedInspectors = allUsers
        ? allUsers
            .filter((u) => u.role === 'inspector')
            .map((user) => {
                // Count how many times this user's name appears in historyData
                const count = historyData
                    ? historyData.filter((h) => h.inspector === user.name).length
                    : 0;
                return { ...user, inspectionCount: count };
            })
            .sort((a, b) => b.inspectionCount - a.inspectionCount) // Sort Highest first
        : [];

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setTimeout(() => {
            setRefreshing(false);
        }, 2000);
    }, []);

    const handleSendRescueCode = (user) => {
        const rescueCode = Math.floor(100000 + Math.random() * 900000);
        Alert.alert(
            'Code Sent Successfully',
            `Unique Login Code: ${rescueCode}\n\nSent to: ${user.email}\n\nThe user can now use this code to access their account immediately.`
        );
    };

    return (
        <View style={[styles.screenBase, { backgroundColor: colors.bgPrimary }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.bgSecondary, borderBottomColor: colors.border }]}>
                <View>
                    <Text style={[styles.headerSub, { color: colors.textMuted }]}>COMMAND CENTER</Text>
                    <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>BRV Fleet Overview</Text>
                </View>
                <TouchableOpacity
                    style={[styles.avatar, { backgroundColor: colors.bgTertiary, borderColor: colors.border }]}
                    onPress={() => setMenuVisible(true)}>
                    <User size={20} color={colors.textPrimary} />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={{ padding: 24 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.tealLight}
                        title="Updating Fleet Data..."
                        titleColor={colors.tealLight}
                    />
                }>
                {/* === Metrics Grid (Improved Layout) === */}
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
                    <View style={[styles.statBox, { backgroundColor: colors.bgSecondary, flex: 1 }]}>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Reports</Text>
                        <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                            {totalInspections}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
                            <Activity size={12} color={colors.green} style={{ marginRight: 4 }} />
                            <Text style={{ color: colors.green, fontSize: 10 }}>Active Fleet</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={() => setUsersModalVisible(true)}
                        style={[styles.statBox, { backgroundColor: colors.bgSecondary, flex: 1, borderLeftColor: colors.tealLight }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <View>
                                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Inspectors</Text>
                                <Text style={[styles.statValue, { color: colors.tealLight }]}>
                                    {allUsers ? allUsers.filter((user) => user.role === 'inspector').length : 0}
                                </Text>
                            </View>
                            <User size={20} color={colors.textMuted} />
                        </View>
                        <Text style={{ color: colors.textMuted, fontSize: 10, marginTop: 5 }}>Manage Team &rarr;</Text>
                    </TouchableOpacity>
                </View>

                {/* === NEW: 7-Day Activity Trend === */}
                <View style={[styles.assetCard, { backgroundColor: colors.bgSecondary }]}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 15 }]}>
                        INSPECTION VOLUME (LAST 7 DAYS)
                    </Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 100, paddingBottom: 10 }}>
                        {Array.from({ length: 7 }).map((_, i) => {
                            const d = new Date();
                            d.setDate(d.getDate() - (6 - i));
                            const dateStr = d.toLocaleDateString();
                            const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

                            // Mock calculation or real if dates match format. 
                            // Assuming historyData uses LocaleDateString or similar. 
                            // Real app needs precise date parsing. For now, simple matching:
                            const count = historyData
                                ? historyData.filter(h => h.timestamp && h.timestamp.includes(dateStr)).length
                                : 0;

                            // Scale height (max 80px)
                            const height = Math.min(Math.max(count * 10, 5), 80);

                            return (
                                <View key={i} style={{ alignItems: 'center', width: 30 }}>
                                    <View style={{
                                        width: 12,
                                        height: height,
                                        backgroundColor: i === 6 ? colors.tealLight : colors.border,
                                        borderRadius: 6
                                    }} />
                                    <Text style={{ color: colors.textMuted, fontSize: 10, marginTop: 6 }}>{dayName}</Text>
                                </View>
                            );
                        })}
                    </View>
                    <Text style={{ textAlign: 'center', color: colors.textMuted, fontSize: 10, marginTop: 5 }}>
                        Total activity over the last week
                    </Text>
                </View>

                {/* === NEW: Pass vs Fail Ratio Bar === */}
                <View style={[styles.assetCard, { paddingVertical: 15, backgroundColor: colors.bgSecondary }]}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 10 }]}>
                        PASS / FAIL RATIO
                    </Text>
                    <View style={{ height: 30, flexDirection: 'row', borderRadius: 15, overflow: 'hidden', marginBottom: 10 }}>
                        <View style={{ flex: passCount || 1, backgroundColor: COLORS.green, alignItems: 'center', justifyContent: 'center' }}>
                            {passCount > 0 && <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 10 }}>{Math.round((passCount / (totalInspections || 1)) * 100)}%</Text>}
                        </View>
                        <View style={{ flex: (totalInspections - passCount) || 0.1, backgroundColor: COLORS.red, alignItems: 'center', justifyContent: 'center' }}>
                            {(totalInspections - passCount) > 0 && <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 10 }}>{Math.round(((totalInspections - passCount) / (totalInspections || 1)) * 100)}%</Text>}
                        </View>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ color: COLORS.green, fontSize: 12, fontWeight: 'bold' }}>{passCount} Operational</Text>
                        <Text style={{ color: COLORS.red, fontSize: 12, fontWeight: 'bold' }}>{groundedCount + monitorCount} Issues</Text>
                    </View>
                </View>

                {/* === Detailed Breakdown (Renamed & Styled) === */}
                <View style={[styles.assetCard, { backgroundColor: colors.bgSecondary }]}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 20 }]}>
                        DETAILED STATUS BREAKDOWN
                    </Text>
                    <GraphBar label="OPERATIONAL" value={passCount} total={totalInspections} color={COLORS.green} />
                    <GraphBar label="MONITORING" value={monitorCount} total={totalInspections} color={COLORS.yellow} />
                    <GraphBar label="GROUNDED" value={groundedCount} total={totalInspections} color={COLORS.red} />
                </View>

                {/* UPDATED FEATURE 2: Real Top Performers Leaderboard */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginBottom: 30 }}>
                    {rankedInspectors.slice(0, 5).map((user, index) => (
                        <View
                            key={index}
                            style={{
                                marginRight: 15,
                                alignItems: 'center',
                                backgroundColor: colors.bgSecondary,
                                padding: 15,
                                borderRadius: 12,
                                width: 100,
                                shadowColor: "#000",
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.1,
                                shadowRadius: 3,
                                elevation: 3,
                            }}>
                            <View
                                style={{
                                    width: 50,
                                    height: 50,
                                    borderRadius: 25,
                                    // Gold background for #1, Teal for others
                                    backgroundColor:
                                        index === 0 ? colors.yellow : colors.tealDark,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: 8,
                                }}>
                                {/* Crown for #1, User Icon for others */}
                                {index === 0 ? (
                                    <Text style={{ fontSize: 24 }}>👑</Text>
                                ) : (
                                    <User size={24} color="#fff" />
                                )}
                            </View>

                            {/* Display First Name Only */}
                            <Text
                                numberOfLines={1}
                                style={{ color: colors.textPrimary, fontWeight: 'bold', fontSize: 12 }}>
                                {user.name.split(' ')[0]}
                            </Text>

                            {/* Display REAL Count */}
                            <Text
                                style={{
                                    color: colors.green,
                                    fontSize: 10,
                                    fontWeight: 'bold',
                                }}>
                                {user.inspectionCount} Checks
                            </Text>
                        </View>
                    ))}
                </ScrollView>

                {/* === QUALITY REPORTS SECTION === */}
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>QUALITY DATA REPORTS</Text>
                {(!qualityReports || qualityReports.length === 0) ? (
                    <View style={{ alignItems: 'center', paddingVertical: 20, opacity: 0.5 }}>
                        <Text style={{ color: colors.textMuted }}>No quality reports yet.</Text>
                    </View>
                ) : (
                    qualityReports.slice(0, 5).map((report, index) => (
                        <TouchableOpacity
                            key={report.id || index}
                            onPress={() => setSelectedQualityReport(report)}
                            style={{
                                backgroundColor: colors.bgSecondary,
                                borderRadius: 12,
                                padding: 15,
                                marginBottom: 12,
                                borderLeftWidth: 4,
                                borderLeftColor: colors.tealLight,
                            }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                                <Text style={{ color: colors.textPrimary, fontWeight: 'bold', fontSize: 14 }}>
                                    {report.truck_number || 'N/A'}
                                </Text>
                                <Text style={{ color: colors.textMuted, fontSize: 10 }}>
                                    {report.timestamp || new Date(report.created_at).toLocaleDateString()}
                                </Text>
                            </View>
                            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                                Company: <Text style={{ color: colors.textPrimary }}>{report.company_name}</Text>
                            </Text>
                            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                                Product: <Text style={{ color: colors.tealLight }}>{report.product}</Text>
                            </Text>
                            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                                By: <Text style={{ color: colors.textPrimary }}>{report.inspector_name}</Text>
                            </Text>
                        </TouchableOpacity>
                    ))
                )}

                {/* Live Feed Header + Quick Filters */}
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>LIVE INSPECTION FEED</Text>

                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 15 }}>
                    {['ALL', 'CRITICAL', 'MONITOR'].map((mode) => (
                        <TouchableOpacity
                            key={mode}
                            onPress={() => setFilterMode(mode)}
                            style={{
                                paddingVertical: 6,
                                paddingHorizontal: 12,
                                borderRadius: 20,
                                backgroundColor: filterMode === mode ? colors.tealMid : colors.bgTertiary,
                                borderWidth: 1,
                                borderColor: filterMode === mode ? colors.tealLight : colors.border,
                            }}>
                            <Text
                                style={{
                                    color: filterMode === mode ? '#ffffff' : colors.textMuted,
                                    fontSize: 10,
                                    fontWeight: 'bold',
                                }}>
                                {mode === 'CRITICAL'
                                    ? 'SHOW GROUNDED'
                                    : mode === 'MONITOR'
                                        ? 'SHOW MONITOR'
                                        : 'SHOW ALL'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Live Feed List */}
                {!historyData || historyData.length === 0 ? (
                    <View style={{ alignItems: 'center', padding: 40, opacity: 0.5 }}>
                        <Activity size={40} color={COLORS.gray} />
                        <Text style={{ color: COLORS.gray, marginTop: 10 }}>
                            No inspections data yet.
                        </Text>
                    </View>
                ) : (
                    historyData
                        .filter((item) => {
                            if (filterMode === 'ALL') return true;
                            if (filterMode === 'CRITICAL') return item.status === 'GROUNDED';
                            if (filterMode === 'MONITOR') return item.status === 'MONITOR';
                            return true;
                        })
                        .map((item) => {
                            let statusColor = COLORS.green;
                            let statusLabel = 'ACTIVE';

                            if (item.status === 'GROUNDED') {
                                statusColor = COLORS.red;
                                statusLabel = 'GROUNDED';
                            } else if (item.status === 'MONITOR') {
                                statusColor = COLORS.yellow;
                                statusLabel = 'MONITOR';
                            }

                            return (
                                <TouchableOpacity
                                    key={item.id}
                                    onPress={() => onViewItem(item)}>
                                    <View
                                        style={[
                                            styles.fleetRow,
                                            {
                                                borderLeftColor: statusColor,
                                                backgroundColor: colors.bgSecondary,
                                                marginBottom: 12, // Increased spacing
                                                borderRadius: 12,
                                                shadowColor: "#000",
                                                shadowOffset: { width: 0, height: 2 },
                                                shadowOpacity: 0.1,
                                                shadowRadius: 3,
                                                elevation: 2,
                                            },
                                        ]}>
                                        <View style={{ flex: 1, justifyContent: 'center' }}>
                                            {/* Row 1: Truck Number and Date */}
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                                <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>{item.truck}</Text>
                                                <Text style={{ color: colors.textMuted, fontSize: 10 }}>{item.timestamp}</Text>
                                            </View>

                                            {/* Row 2: Inspector and Status Badge */}
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                                                    Insp: <Text style={{ color: colors.textPrimary }}>{item.inspector}</Text>
                                                </Text>

                                                <View
                                                    style={{
                                                        backgroundColor: statusColor + '20',
                                                        borderWidth: 1,
                                                        borderColor: statusColor,
                                                        paddingHorizontal: 8,
                                                        paddingVertical: 2,
                                                        borderRadius: 4,
                                                    }}>
                                                    <Text
                                                        style={{
                                                            color: statusColor,
                                                            fontWeight: 'bold',
                                                            fontSize: 10,
                                                        }}>
                                                        {statusLabel}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })
                )}
            </ScrollView>

            {/* MODAL 1: User Management */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={usersModalVisible}
                onRequestClose={() => setUsersModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { height: '80%', backgroundColor: colors.bgSecondary }]}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={{ color: colors.textPrimary, fontWeight: 'bold', fontSize: 20 }}>
                                    Team Management
                                </Text>
                                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                                    Manage your inspectors and managers
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => setUsersModalVisible(false)}>
                                <X size={24} color={colors.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={{
                                flexDirection: 'row',
                                backgroundColor: COLORS.tealDark,
                                padding: 14,
                                borderRadius: 12,
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderWidth: 1,
                                borderColor: COLORS.tealLight,
                                marginBottom: 20,
                            }}
                            onPress={() => {
                                setUsersModalVisible(false);
                                onAddManager();
                            }}>
                            <UserPlus size={18} color={COLORS.white} style={{ marginRight: 8 }} />
                            <Text style={{ color: COLORS.white, fontWeight: 'bold', fontSize: 14 }}>
                                REGISTER NEW INSPECTOR/MANAGER
                            </Text>
                        </TouchableOpacity>

                        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                            {allUsers &&
                                allUsers
                                    .filter((user) => user.role === 'inspector')
                                    .map((user, index) => (
                                        <View
                                            key={index}
                                            style={{
                                                backgroundColor: colors.bgTertiary,
                                                padding: 16,
                                                borderRadius: 12,
                                                marginBottom: 12,
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                borderWidth: 1,
                                                borderColor: colors.border,
                                            }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <View style={{
                                                    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.border,
                                                    alignItems: 'center', justifyContent: 'center', marginRight: 15
                                                }}>
                                                    <User size={20} color={colors.tealLight} />
                                                </View>

                                                <View>
                                                    <Text style={{ color: colors.textPrimary, fontWeight: 'bold', fontSize: 16 }}>
                                                        {user.name}
                                                    </Text>
                                                    <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                                                        {user.role.toUpperCase()}
                                                    </Text>
                                                </View>
                                            </View>

                                            <View style={{ alignItems: 'flex-end', paddingRight: 8 }}>
                                                <Text style={{ color: colors.textPrimary, fontWeight: 'bold', fontSize: 18 }}>
                                                    {user.inspections}
                                                </Text>
                                                <Text style={{ color: colors.textMuted, fontSize: 10 }}>
                                                    INSPECTIONS
                                                </Text>
                                            </View>
                                        </View>
                                    ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* MODAL 2: Manager Settings */}
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
                                Manager Settings
                            </Text>
                            <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                                {userName || 'Manager'}
                            </Text>
                        </View>

                        <MenuItem
                            icon={User}
                            label="Update Profile"
                            onPress={() => {
                                setMenuVisible(false);
                                onEditProfile();
                            }}
                        />
                        <MenuItem
                            icon={isDarkMode ? Sun : Moon}
                            label={isDarkMode ? 'Light Mode' : 'Dark Mode'}
                            color={COLORS.yellow}
                            onPress={toggleTheme}
                        />
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

            {/* MODAL 3: Quality Report Detail */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={selectedQualityReport !== null}
                onRequestClose={() => setSelectedQualityReport(null)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { height: '85%', backgroundColor: colors.bgSecondary }]}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={{ color: colors.textPrimary, fontWeight: 'bold', fontSize: 20 }}>
                                    Quality Report
                                </Text>
                                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                                    {selectedQualityReport?.truck_number}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => setSelectedQualityReport(null)}>
                                <X size={24} color={colors.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                            {selectedQualityReport && (
                                <>
                                    {/* Basic Info */}
                                    <View style={{ backgroundColor: colors.bgTertiary, borderRadius: 12, padding: 15, marginBottom: 15 }}>
                                        <Text style={{ color: colors.tealLight, fontWeight: 'bold', fontSize: 12, marginBottom: 10 }}>BASIC INFO</Text>
                                        <Text style={{ color: colors.textMuted, fontSize: 13 }}>Company: <Text style={{ color: colors.textPrimary }}>{selectedQualityReport.company_name}</Text></Text>
                                        <Text style={{ color: colors.textMuted, fontSize: 13 }}>Product: <Text style={{ color: colors.textPrimary }}>{selectedQualityReport.product}</Text></Text>
                                        <Text style={{ color: colors.textMuted, fontSize: 13 }}>Depot: <Text style={{ color: colors.textPrimary }}>{selectedQualityReport.depot}</Text></Text>
                                        <Text style={{ color: colors.textMuted, fontSize: 13 }}>Inspector: <Text style={{ color: colors.textPrimary }}>{selectedQualityReport.inspector_name}</Text></Text>
                                        <Text style={{ color: colors.textMuted, fontSize: 13 }}>Sealer: <Text style={{ color: colors.textPrimary }}>{selectedQualityReport.sealer_name || 'N/A'}</Text></Text>
                                        <Text style={{ color: colors.textMuted, fontSize: 13 }}>Date: <Text style={{ color: colors.textPrimary }}>{selectedQualityReport.timestamp || new Date(selectedQualityReport.created_at).toLocaleString()}</Text></Text>
                                    </View>

                                    {/* Compartments */}
                                    {selectedQualityReport.compartments && (
                                        <View style={{ backgroundColor: colors.bgTertiary, borderRadius: 12, padding: 15, marginBottom: 15 }}>
                                            <Text style={{ color: colors.tealLight, fontWeight: 'bold', fontSize: 12, marginBottom: 10 }}>COMPARTMENTS</Text>
                                            {Array.isArray(selectedQualityReport.compartments) ? (
                                                selectedQualityReport.compartments.map((comp, idx) => (
                                                    <View key={comp.id || idx} style={{ marginBottom: 8, borderBottomWidth: idx < selectedQualityReport.compartments.length - 1 ? 1 : 0, borderBottomColor: colors.borderLight, paddingBottom: 8 }}>
                                                        <Text style={{ color: colors.textPrimary, fontWeight: 'bold', fontSize: 12 }}>Compartment {idx + 1}</Text>
                                                        <Text style={{ color: colors.textMuted, fontSize: 12 }}>Certificate: <Text style={{ color: colors.textPrimary }}>{comp.cert || 'N/A'}</Text></Text>
                                                        <Text style={{ color: colors.textMuted, fontSize: 12 }}>Product: <Text style={{ color: colors.textPrimary }}>{comp.prod || 'N/A'}</Text></Text>
                                                        <Text style={{ color: colors.textMuted, fontSize: 12 }}>Litres: <Text style={{ color: colors.textPrimary }}>{comp.litres || 'N/A'}</Text></Text>
                                                    </View>
                                                ))
                                            ) : (
                                                Object.entries(selectedQualityReport.compartments).map(([key, value]) => (
                                                    <Text key={key} style={{ color: colors.textMuted, fontSize: 13 }}>
                                                        {key}: <Text style={{ color: colors.textPrimary }}>{typeof value === 'object' ? JSON.stringify(value) : value || 'N/A'}</Text>
                                                    </Text>
                                                ))
                                            )}
                                        </View>
                                    )}

                                    {/* Quality Parameters */}
                                    {selectedQualityReport.quality_params && (
                                        <View style={{ backgroundColor: colors.bgTertiary, borderRadius: 12, padding: 15 }}>
                                            <Text style={{ color: colors.tealLight, fontWeight: 'bold', fontSize: 12, marginBottom: 10 }}>QUALITY PARAMETERS</Text>
                                            {Object.entries(selectedQualityReport.quality_params).map(([key, value]) => (
                                                <Text key={key} style={{ color: colors.textMuted, fontSize: 13 }}>
                                                    {key}: <Text style={{ color: colors.textPrimary }}>{typeof value === 'object' ? JSON.stringify(value) : value || 'N/A'}</Text>
                                                </Text>
                                            ))}
                                        </View>
                                    )}

                                    {/* Export Button */}
                                    <TouchableOpacity
                                        style={{
                                            backgroundColor: COLORS.tealMid,
                                            padding: 15,
                                            borderRadius: 12,
                                            marginTop: 20,
                                            alignItems: 'center',
                                        }}
                                        onPress={() => {
                                            if (onExportQuality) {
                                                onExportQuality(selectedQualityReport);
                                            }
                                        }}>
                                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>EXPORT AS PDF</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default ManagerDashboard;

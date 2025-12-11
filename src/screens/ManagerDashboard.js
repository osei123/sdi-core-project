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
} from 'lucide-react-native';
import { styles } from '../styles/globalStyles';
import { COLORS } from '../constants/colors';
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
}) => {
    const [refreshing, setRefreshing] = useState(false);
    const [usersModalVisible, setUsersModalVisible] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);

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
        <View style={styles.screenBase}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerSub}>COMMAND CENTER</Text>
                    <Text style={styles.headerTitle}>BRV Fleet Overview</Text>
                </View>
                <TouchableOpacity
                    style={styles.avatar}
                    onPress={() => setMenuVisible(true)}>
                    <User size={20} color={COLORS.white} />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={{ padding: 24 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={COLORS.tealLight}
                        title="Updating Fleet Data..."
                        titleColor={COLORS.tealLight}
                    />
                }>
                {/* Metrics Grid */}
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
                    <View
                        style={[
                            styles.statBox,
                            { borderLeftColor: COLORS.blue, backgroundColor: '#1e1e1e' },
                        ]}>
                        <Text style={styles.statLabel}>Total Reports</Text>
                        <Text style={[styles.statValue, { color: COLORS.white }]}>
                            {totalInspections}
                        </Text>
                    </View>

                    <TouchableOpacity
                        onPress={() => setUsersModalVisible(true)}
                        style={[
                            styles.statBox,
                            { borderLeftColor: COLORS.tealLight, backgroundColor: '#1e1e1e' },
                        ]}>
                        <View
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                            }}>
                            <View>
                                <Text style={[styles.statValue, { color: COLORS.tealLight }]}>
                                    {allUsers
                                        ? allUsers.filter((user) => user.role === 'inspector')
                                            .length
                                        : 0}
                                </Text>
                            </View>
                            <User size={20} color={COLORS.gray} />
                        </View>
                        <Text style={{ color: COLORS.gray, fontSize: 10, marginTop: 5 }}>
                            Tap to manage users
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* UPDATED FEATURE 1: Attention Needed (Real Data) */}
                <View
                    style={{
                        backgroundColor: 'rgba(234, 179, 8, 0.1)',
                        padding: 15,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: COLORS.yellow,
                        marginBottom: 24,
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}>
                    <AlertTriangle
                        size={24}
                        color={COLORS.yellow}
                        style={{ marginRight: 15 }}
                    />
                    <View>
                        <Text
                            style={{
                                color: COLORS.yellow,
                                fontWeight: 'bold',
                                fontSize: 16,
                            }}>
                            ATTENTION NEEDED
                        </Text>
                        <Text style={{ color: COLORS.gray, fontSize: 12 }}>
                            {attentionCount} trucks require attention (Critical or Monitor).
                        </Text>
                    </View>
                </View>

                {/* Analytics Graph */}
                <View style={styles.assetCard}>
                    <Text
                        style={[
                            styles.sectionTitle,
                            { color: COLORS.white, marginBottom: 20 },
                        ]}>
                        BRV TRUCK HEALTH ANALYTICS
                    </Text>

                    <GraphBar
                        label="OPERATIONAL (PASS)"
                        value={passCount}
                        total={totalInspections}
                        color={COLORS.green}
                    />
                    <GraphBar
                        label="MONITORING REQUIRED"
                        value={monitorCount}
                        total={totalInspections}
                        color={COLORS.yellow}
                    />
                    <GraphBar
                        label="GROUNDED (CRITICAL)"
                        value={groundedCount}
                        total={totalInspections}
                        color={COLORS.red}
                    />
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
                                backgroundColor: '#252525',
                                padding: 15,
                                borderRadius: 12,
                                width: 100,
                            }}>
                            <View
                                style={{
                                    width: 50,
                                    height: 50,
                                    borderRadius: 25,
                                    // Gold background for #1, Teal for others
                                    backgroundColor:
                                        index === 0 ? COLORS.yellow : COLORS.tealDark,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: 8,
                                }}>
                                {/* Crown for #1, User Icon for others */}
                                {index === 0 ? (
                                    <Text style={{ fontSize: 24 }}>👑</Text>
                                ) : (
                                    <User size={24} color="white" />
                                )}
                            </View>

                            {/* Display First Name Only */}
                            <Text
                                numberOfLines={1}
                                style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>
                                {user.name.split(' ')[0]}
                            </Text>

                            {/* Display REAL Count */}
                            <Text
                                style={{
                                    color: COLORS.green,
                                    fontSize: 10,
                                    fontWeight: 'bold',
                                }}>
                                {user.inspectionCount} Checks
                            </Text>
                        </View>
                    ))}
                </ScrollView>

                {/* Live Feed Header + Quick Filters */}
                <Text style={styles.sectionTitle}>LIVE INSPECTION FEED</Text>

                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 15 }}>
                    {['ALL', 'CRITICAL', 'MONITOR'].map((mode) => (
                        <TouchableOpacity
                            key={mode}
                            onPress={() => setFilterMode(mode)}
                            style={{
                                paddingVertical: 6,
                                paddingHorizontal: 12,
                                borderRadius: 20,
                                backgroundColor: filterMode === mode ? COLORS.tealMid : '#333',
                                borderWidth: 1,
                                borderColor: filterMode === mode ? COLORS.tealLight : '#444',
                            }}>
                            <Text
                                style={{
                                    color: filterMode === mode ? COLORS.white : COLORS.gray,
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
                                                backgroundColor: '#1e1e1e',
                                                marginBottom: 10,
                                            },
                                        ]}>
                                        <View>
                                            <Text style={styles.rowTitle}>{item.truck}</Text>
                                            <Text style={{ color: COLORS.gray, fontSize: 12 }}>
                                                Insp:{' '}
                                                <Text style={{ color: COLORS.white }}>
                                                    {item.inspector}
                                                </Text>{' '}
                                                • {item.timestamp}
                                            </Text>
                                        </View>

                                        <View
                                            style={[
                                                styles.statusBadge,
                                                {
                                                    backgroundColor: statusColor + '20',
                                                    borderWidth: 1,
                                                    borderColor: statusColor,
                                                },
                                            ]}>
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
                    <View style={[styles.modalContent, { height: '90%' }]}>
                        <View style={styles.modalHeader}>
                            <Text
                                style={{
                                    color: COLORS.tealLight,
                                    fontWeight: 'bold',
                                    fontSize: 18,
                                }}>
                                INSPECTOR TEAM
                            </Text>
                            <TouchableOpacity
                                style={{
                                    marginTop: 10,
                                    marginBottom: 20,
                                    backgroundColor: COLORS.tealDark,
                                    padding: 10,
                                    borderRadius: 8,
                                    alignItems: 'center',
                                    borderWidth: 1,
                                    borderColor: COLORS.tealLight,
                                }}
                                onPress={() => {
                                    setUsersModalVisible(false);
                                    onAddManager();
                                }}>
                                <UserPlus
                                    size={16}
                                    color={COLORS.white}
                                    style={{ marginBottom: 4 }}
                                />
                                <Text
                                    style={{
                                        color: COLORS.white,
                                        fontWeight: 'bold',
                                        fontSize: 12,
                                    }}>
                                    + REGISTER NEW MANAGER
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setUsersModalVisible(false)}>
                                <X size={24} color={COLORS.white} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                            {allUsers &&
                                allUsers
                                    .filter((user) => user.role === 'inspector')
                                    .map((user, index) => (
                                        <View
                                            key={index}
                                            style={{
                                                backgroundColor: '#2a2a2a',
                                                padding: 20,
                                                borderRadius: 16,
                                                marginBottom: 16,
                                                borderWidth: 1,
                                                borderColor: '#333',
                                                shadowColor: '#000',
                                                shadowOffset: { width: 0, height: 2 },
                                                shadowOpacity: 0.3,
                                                shadowRadius: 4,
                                                elevation: 5,
                                            }}>
                                            <View
                                                style={{
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    marginBottom: 12,
                                                }}>
                                                <View
                                                    style={{
                                                        width: 40,
                                                        height: 40,
                                                        borderRadius: 20,
                                                        backgroundColor: COLORS.tealDark,
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        marginRight: 12,
                                                    }}>
                                                    <User size={20} color={COLORS.white} />
                                                </View>
                                                <View>
                                                    <Text
                                                        style={{
                                                            color: COLORS.white,
                                                            fontWeight: 'bold',
                                                            fontSize: 16,
                                                        }}>
                                                        {user.name}
                                                    </Text>
                                                    <Text style={{ color: COLORS.gray, fontSize: 12 }}>
                                                        @{user.username}
                                                    </Text>
                                                </View>
                                            </View>

                                            <View
                                                style={{
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    marginBottom: 16,
                                                    backgroundColor: 'rgba(0,0,0,0.3)',
                                                    padding: 8,
                                                    borderRadius: 6,
                                                }}>
                                                <MapPin
                                                    size={14}
                                                    color={COLORS.green}
                                                    style={{ marginRight: 6 }}
                                                />
                                                <Text style={{ color: COLORS.gray, fontSize: 12 }}>
                                                    Reg. Point:{' '}
                                                    <Text
                                                        style={{ color: COLORS.green, fontWeight: 'bold' }}>
                                                        {user.registeredLocation || 'Headquarters'}
                                                    </Text>
                                                </Text>
                                            </View>

                                            <TouchableOpacity
                                                style={{
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    backgroundColor: 'rgba(234, 179, 8, 0.1)',
                                                    padding: 12,
                                                    borderRadius: 8,
                                                    borderWidth: 1,
                                                    borderColor: 'rgba(234, 179, 8, 0.3)',
                                                }}
                                                onPress={() => handleSendRescueCode(user)}>
                                                <Key
                                                    size={16}
                                                    color={COLORS.yellow}
                                                    style={{ marginRight: 8 }}
                                                />
                                                <Text
                                                    style={{
                                                        color: COLORS.yellow,
                                                        fontWeight: 'bold',
                                                        fontSize: 12,
                                                    }}>
                                                    SEND LOGIN RESCUE CODE
                                                </Text>
                                            </TouchableOpacity>
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
                                Manager Settings
                            </Text>
                            <Text style={{ color: COLORS.gray, fontSize: 12 }}>
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

export default ManagerDashboard;

import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Modal,
} from 'react-native';
import {
    Download,
    Trash,
    History,
    X,
    FileText,
    Calendar,
} from 'lucide-react-native';
import { styles } from '../styles/globalStyles';
import { useTheme } from '../contexts/ThemeContext';

const HistoryScreen = ({ data, onBack, onDelete, onView, onExport }) => {
    const { colors, isDarkMode } = useTheme();
    const [exportModalVisible, setExportModalVisible] = useState(false);
    const [dateSelectorVisible, setDateSelectorVisible] = useState(false);

    const getStatusColor = (status) => {
        if (status === 'GROUNDED') return colors.red;
        if (status === 'MONITOR') return colors.yellow;
        return colors.green;
    };

    const getStatusText = (status) => {
        if (status === 'GROUNDED') return 'UNSAFE - GROUNDED';
        if (status === 'MONITOR') return 'SAFE - MONITOR';
        return 'CLEAN - OPERATIONAL';
    };

    const getAvailableDates = () => {
        const dates = data.map((item) => item.timestamp.split(',')[0].trim());
        return [...new Set(dates)];
    };
    const availableDates = getAvailableDates();

    const handleDateSelect = (dateStr) => {
        const filteredList = data.filter((item) =>
            item.timestamp.includes(dateStr)
        );
        setDateSelectorVisible(false);
        setExportModalVisible(false);
        setTimeout(() => {
            onExport(filteredList);
        }, 500);
    };

    return (
        <View style={[styles.screenBase, { backgroundColor: colors.bgPrimary }]}>
            <View style={[styles.header, { backgroundColor: colors.bgSecondary, borderBottomColor: colors.border }]}>
                <View>
                    <Text style={[styles.headerSub, { color: colors.textMuted }]}>INSPECTION LOGS</Text>
                    <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>All Activity</Text>
                </View>

                <TouchableOpacity
                    style={{
                        backgroundColor: `${colors.blue}15`,
                        padding: 10,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: `${colors.blue}50`,
                    }}
                    onPress={() => setExportModalVisible(true)}>
                    <Download size={20} color={colors.blue} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
                {data.length === 0 ? (
                    <View style={{ alignItems: 'center', marginTop: 50, opacity: 0.5 }}>
                        <History size={48} color={colors.textMuted} />
                        <Text style={{ color: colors.textMuted, marginTop: 10 }}>
                            No inspections recorded yet.
                        </Text>
                    </View>
                ) : (
                    data.map((item) => (
                        <View
                            key={item.id}
                            style={[styles.historyItem, { backgroundColor: colors.bgSecondary, borderColor: colors.border, paddingRight: 10 }]}>
                            <TouchableOpacity
                                style={{ flex: 1 }}
                                onPress={() => onView(item)}>
                                <View>
                                    <Text style={[styles.historyTitle, { color: colors.textPrimary }]}>{item.truck}</Text>
                                    <Text style={[styles.historyDate, { color: colors.textMuted }]}>{item.timestamp}</Text>
                                    <Text
                                        style={{
                                            color: getStatusColor(item.status),
                                            fontSize: 10,
                                            fontWeight: 'bold',
                                            marginTop: 4,
                                        }}>
                                        {getStatusText(item.status)}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => onDelete(item.id)}
                                style={{ padding: 10 }}>
                                <Trash size={20} color={colors.red} />
                            </TouchableOpacity>
                        </View>
                    ))
                )}
            </ScrollView>

            {/* EXPORT MODAL */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={exportModalVisible}
                onRequestClose={() => setExportModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View
                        style={[styles.modalContent, { height: 'auto', maxHeight: '50%', backgroundColor: colors.bgSecondary }]}>
                        <View style={styles.modalHeader}>
                            <Text
                                style={{
                                    color: colors.textPrimary,
                                    fontWeight: 'bold',
                                    fontSize: 18,
                                }}>
                                EXPORT OPTIONS
                            </Text>
                            <TouchableOpacity onPress={() => setExportModalVisible(false)}>
                                <X size={24} color={colors.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        <View style={{ gap: 15, marginBottom: 30 }}>
                            <Text style={{ color: colors.textSecondary, marginBottom: 5 }}>
                                Select export format:
                            </Text>
                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: colors.blue }]}
                                onPress={() => {
                                    setExportModalVisible(false);
                                    setTimeout(() => onExport(data), 500);
                                }}>
                                <View>
                                    <Text style={styles.actionBtnTitle}>Download Full Log</Text>
                                    <Text style={styles.actionBtnSub}>All dates combined</Text>
                                </View>
                                <FileText size={24} color="#fff" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: colors.tealDark }]}
                                onPress={() => {
                                    setExportModalVisible(false);
                                    setTimeout(() => setDateSelectorVisible(true), 300);
                                }}>
                                <View>
                                    <Text style={styles.actionBtnTitle}>
                                        Select Specific Date
                                    </Text>
                                    <Text style={styles.actionBtnSub}>Pick from history</Text>
                                </View>
                                <Calendar size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* DATE SELECTOR MODAL */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={dateSelectorVisible}
                onRequestClose={() => setDateSelectorVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { height: '60%', backgroundColor: colors.bgSecondary }]}>
                        <View style={styles.modalHeader}>
                            <Text
                                style={{
                                    color: colors.textPrimary,
                                    fontWeight: 'bold',
                                    fontSize: 18,
                                }}>
                                SELECT DATE
                            </Text>
                            <TouchableOpacity onPress={() => setDateSelectorVisible(false)}>
                                <X size={24} color={colors.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={{ color: colors.textSecondary, marginBottom: 20 }}>
                            Tap a date to download its report:
                        </Text>

                        <ScrollView>
                            {availableDates.length === 0 ? (
                                <Text style={{ color: colors.red, textAlign: 'center' }}>
                                    No dates found in history.
                                </Text>
                            ) : (
                                availableDates.map((date, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={{
                                            padding: 20,
                                            backgroundColor: colors.bgTertiary,
                                            marginBottom: 10,
                                            borderRadius: 12,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            borderWidth: 1,
                                            borderColor: colors.border,
                                        }}
                                        onPress={() => handleDateSelect(date)}>
                                        <Calendar
                                            size={20}
                                            color={colors.tealLight}
                                            style={{ marginRight: 15 }}
                                        />
                                        <Text
                                            style={{
                                                color: colors.textPrimary,
                                                fontSize: 18,
                                                fontWeight: 'bold',
                                            }}>
                                            {date}
                                        </Text>
                                    </TouchableOpacity>
                                ))
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default HistoryScreen;

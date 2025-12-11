import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import {
    ArrowLeft,
    CheckCircle,
    Octagon,
    Download,
} from 'lucide-react-native';
import { styles } from '../styles/globalStyles';
import { COLORS } from '../constants/colors';

const InspectionDetailsScreen = ({ item, onBack, onExport }) => {
    if (!item) return null;
    const failedItems = item.items.filter((i) => i.status === 'FAIL');

    let statusColor = COLORS.green;
    let statusText = 'OPERATIONAL';

    if (item.status === 'GROUNDED') {
        statusColor = COLORS.red;
        statusText = 'GROUNDED (UNSAFE)';
    } else if (item.status === 'MONITOR') {
        statusColor = COLORS.yellow;
        statusText = 'SAFE TO DRIVE (MONITOR)';
    }

    return (
        <View style={styles.screenBase}>
            {/* Header */}
            <View style={[styles.header, { justifyContent: 'flex-start', gap: 15 }]}>
                <TouchableOpacity onPress={onBack}>
                    <ArrowLeft size={24} color={COLORS.gray} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Report Details</Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 50 }}>
                {/* Status Card */}
                <View style={[styles.assetCard, { borderColor: statusColor }]}>
                    <Text style={styles.cardLabel}>VEHICLE STATUS</Text>
                    <Text style={[styles.assetName, { color: statusColor }]}>
                        {statusText}
                    </Text>
                    <Text style={styles.assetId}>{item.truck}</Text>
                    <Text style={{ color: COLORS.gray }}>{item.timestamp}</Text>
                </View>

                {/* FEATURE 3 UI: DIGITAL GATE PASS */}
                {item.status === 'PASS' && (
                    <View
                        style={{
                            backgroundColor: '#064e3b',
                            padding: 20,
                            borderRadius: 16,
                            alignItems: 'center',
                            marginBottom: 24,
                            borderWidth: 2,
                            borderColor: COLORS.green,
                            borderStyle: 'dashed',
                        }}>
                        <CheckCircle
                            size={48}
                            color={COLORS.green}
                            style={{ marginBottom: 10 }}
                        />
                        <Text
                            style={{
                                color: COLORS.white,
                                fontSize: 24,
                                fontWeight: '900',
                                letterSpacing: 2,
                            }}>
                            GATE PASS VALID
                        </Text>
                        <Text
                            style={{ color: COLORS.tealLight, fontSize: 14, marginTop: 5 }}>
                            {item.truck} is authorized to load.
                        </Text>
                        <Text style={{ color: COLORS.gray, fontSize: 10, marginTop: 15 }}>
                            Time Stamp: {item.timestamp}
                        </Text>
                    </View>
                )}

                <Text style={styles.sectionTitle}>DEFECT SUMMARY</Text>

                {failedItems.length === 0 ? (
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 10,
                            marginTop: 10,
                        }}>
                        <CheckCircle size={24} color={COLORS.green} />
                        <Text style={{ color: COLORS.white }}>
                            No defects reported. Safe to drive.
                        </Text>
                    </View>
                ) : (
                    failedItems.map((fail, index) => (
                        <View
                            key={index}
                            style={{
                                backgroundColor: '#2a1a1a',
                                padding: 15,
                                borderRadius: 8,
                                marginBottom: 10,
                                borderLeftWidth: 4,
                                borderLeftColor:
                                    fail.severity === 'CRITICAL' ? COLORS.red : COLORS.yellow,
                            }}>
                            <View
                                style={{
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    marginBottom: 5,
                                }}>
                                <Text
                                    style={{
                                        color: COLORS.white,
                                        fontWeight: 'bold',
                                        fontSize: 16,
                                    }}>
                                    {fail.title || `Defect #${fail.id}`}
                                </Text>
                                {fail.severity === 'CRITICAL' && (
                                    <Octagon size={16} color={COLORS.red} />
                                )}
                            </View>

                            <Text
                                style={{
                                    color:
                                        fail.severity === 'CRITICAL' ? COLORS.red : COLORS.yellow,
                                    marginBottom: 5,
                                    fontWeight: 'bold',
                                }}>
                                {fail.severity}
                            </Text>

                            <View
                                style={{
                                    backgroundColor: 'rgba(0,0,0,0.3)',
                                    padding: 10,
                                    borderRadius: 6,
                                    marginTop: 5,
                                }}>
                                <Text
                                    style={{ color: COLORS.gray, fontSize: 10, marginBottom: 2 }}>
                                    INSPECTOR NOTE:
                                </Text>
                                <Text style={{ color: COLORS.white, fontStyle: 'italic' }}>
                                    "{fail.note || 'No details provided.'}"
                                </Text>
                            </View>
                        </View>
                    ))
                )}

                {/* Export Button */}
                <TouchableOpacity
                    style={{
                        marginTop: 30,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: COLORS.tealDark,
                        padding: 15,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: COLORS.tealMid,
                    }}
                    onPress={() => onExport(item)}>
                    <Download
                        size={20}
                        color={COLORS.tealLight}
                        style={{ marginRight: 10 }}
                    />
                    <Text style={{ color: COLORS.white, fontWeight: 'bold' }}>
                        EXPORT AS PDF
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

export default InspectionDetailsScreen;

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import {
    ArrowLeft,
    AlertTriangle,
    User,
    Truck,
    FileText,
    MapPin,
} from 'lucide-react-native';
import { styles } from '../styles/globalStyles';
import { COLORS } from '../constants/colors';

const PreInspectionScreen = ({ onProceed, onCancel, history }) => {
    const [formData, setFormData] = useState({
        'Driver Name': '',
        'Truck Number': '',
        Transporter: '',
        Depot: '',
    });
    // --- NEW: SMART HISTORY CHECK (Supports Red & Yellow Alerts) ---
    const [historyAlert, setHistoryAlert] = useState(null);

    useEffect(() => {
        const truckNum = formData['Truck Number'];

        // Only search if we have a truck number and history exists
        if (truckNum && truckNum.length > 2 && history) {
            // Find the most recent check for this truck (Case insensitive)
            const lastRecord = history.find(
                (item) => item.truck.toLowerCase() === truckNum.toLowerCase()
            );

            // Check if it is GROUNDED or MONITOR
            if (
                lastRecord &&
                (lastRecord.status === 'GROUNDED' || lastRecord.status === 'MONITOR')
            ) {
                setHistoryAlert(lastRecord);
            } else {
                setHistoryAlert(null);
            }
        } else {
            setHistoryAlert(null);
        }
    }, [formData, history]);

    const fields = [
        { label: 'Driver Name', icon: User, key: 'Driver Name' },
        { label: 'Truck Number', icon: Truck, key: 'Truck Number' },
        { label: 'Transporter', icon: FileText, key: 'Transporter' },
        { label: 'Depot', icon: MapPin, key: 'Depot' },
    ];

    const handleStart = () => {
        const isValid = Object.values(formData).every(
            (val) => val && val.trim().length > 0
        );
        if (!isValid) {
            Alert.alert(
                'Missing Information',
                'Please fill in all details (Driver, Truck, Transporter, and Depot) to proceed.'
            );
            return;
        }
        onProceed(formData);
    };

    return (
        <View style={styles.screenBase}>
            <View style={[styles.header, { justifyContent: 'flex-start', gap: 15 }]}>
                <TouchableOpacity onPress={onCancel}>
                    <ArrowLeft size={24} color={COLORS.gray} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Inspection Details</Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={{ padding: 24 }}>
                    <Text style={{ color: COLORS.gray, marginBottom: 24 }}>
                        Fill and Verify details before starting.
                    </Text>
                    {/* --- DYNAMIC TROUBLE TRUCK ALERT --- */}
                    {historyAlert && (
                        <View
                            style={{
                                // Dynamic Background: Red for Grounded, Yellow for Monitor
                                backgroundColor:
                                    historyAlert.status === 'GROUNDED'
                                        ? 'rgba(220, 38, 38, 0.15)' // Red Tint
                                        : 'rgba(234, 179, 8, 0.15)', // Yellow Tint

                                borderLeftWidth: 4,

                                // Dynamic Border: Red vs Yellow
                                borderLeftColor:
                                    historyAlert.status === 'GROUNDED' ? '#dc2626' : '#ca8a04',

                                padding: 15,
                                borderRadius: 8,
                                marginBottom: 20,
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}>
                            {/* Dynamic Icon Color */}
                            <AlertTriangle
                                size={24}
                                color={historyAlert.status === 'GROUNDED' ? '#dc2626' : '#ca8a04'}
                                style={{ marginRight: 15 }}
                            />

                            <View style={{ flex: 1 }}>
                                <Text
                                    style={{
                                        // Dynamic Title Color
                                        color:
                                            historyAlert.status === 'GROUNDED' ? '#dc2626' : '#ca8a04',
                                        fontWeight: 'bold',
                                        marginBottom: 4,
                                    }}>
                                    {historyAlert.status === 'GROUNDED'
                                        ? '⛔ STOP: TRUCK GROUNDED'
                                        : '⚠️ ATTENTION: MONITORING'}
                                </Text>

                                <Text style={{ color: COLORS.white, fontSize: 12 }}>
                                    Last Status:{' '}
                                    <Text style={{ fontWeight: 'bold' }}>
                                        {historyAlert.status}
                                    </Text>
                                </Text>
                                <Text style={{ color: COLORS.gray, fontSize: 12 }}>
                                    Date: {historyAlert.timestamp}
                                </Text>

                                <Text
                                    style={{
                                        color: COLORS.tealLight,
                                        fontSize: 12,
                                        marginTop: 6,
                                        fontStyle: 'italic',
                                        fontWeight: 'bold',
                                    }}>
                                    "Please verify previous defects are fixed."
                                </Text>
                            </View>
                        </View>
                    )}
                    {/* ------------------------------------- */}
                    {fields.map((f, i) => (
                        <View key={i} style={{ marginBottom: 20 }}>
                            <Text style={styles.label}>{f.label}</Text>
                            <View style={styles.formInput}>
                                <f.icon
                                    size={16}
                                    color={COLORS.gray}
                                    style={{ marginRight: 10 }}
                                />
                                <TextInput
                                    style={{ flex: 1, color: COLORS.white }}
                                    placeholder={`Enter ${f.label}`}
                                    placeholderTextColor="#555"
                                    value={formData[f.key]}
                                    onChangeText={(text) =>
                                        setFormData({ ...formData, [f.key]: text })
                                    }
                                />
                            </View>
                        </View>
                    ))}
                </ScrollView>

                <View style={styles.footerAction}>
                    <TouchableOpacity style={styles.primaryButton} onPress={handleStart}>
                        <Text style={styles.primaryButtonText}>START CHECKLIST</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

export default PreInspectionScreen;

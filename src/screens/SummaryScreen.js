import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, Alert } from 'react-native';
import SignatureScreen from 'react-native-signature-canvas';
import {
    CheckCircle,
    XCircle,
    AlertTriangle,
    User,
    Shield,
    FileText,
} from 'lucide-react-native';
import { styles } from '../styles/globalStyles';
import { COLORS } from '../constants/colors';

const SummaryScreen = ({ results, onHome }) => {
    const [showSignatureModal, setShowSignatureModal] = useState(false);
    const [signerType, setSignerType] = useState(null); // 'driver' or 'inspector'
    const [driverSig, setDriverSig] = useState(null);
    const [inspectorSig, setInspectorSig] = useState(null);
    const signatureRef = useRef(null);

    const issues = results.filter((r) => r.status === 'FAIL');
    const criticalCount = issues.filter((r) => r.severity === 'CRITICAL').length;
    const isGrounded = criticalCount > 0;
    const isMonitor = issues.length > 0 && !isGrounded;

    let summaryColor = COLORS.green;
    let summaryText = 'OPERATIONAL';
    let Icon = CheckCircle;
    if (isGrounded) {
        summaryColor = COLORS.red;
        summaryText = 'GROUNDED (UNSAFE)';
        Icon = XCircle;
    } else if (isMonitor) {
        summaryColor = COLORS.yellow;
        summaryText = 'SAFE TO DRIVE (MONITOR)';
        Icon = AlertTriangle;
    }

    const openSignaturePad = (type) => {
        setSignerType(type);
        setShowSignatureModal(true);
    };

    const handleSignatureOK = (signature) => {
        if (signerType === 'driver') {
            setDriverSig(signature);
        } else {
            setInspectorSig(signature);
        }
        setShowSignatureModal(false);
        setSignerType(null);
    };

    const handleClear = () => {
        signatureRef.current.clearSignature();
    };

    const handleSubmitPad = () => {
        signatureRef.current.readSignature();
    };

    const handleFinalSubmit = () => {
        if (!driverSig || !inspectorSig) {
            Alert.alert(
                'Signatures Required',
                'Both Driver and Inspector must sign before finishing.'
            );
            return;
        }
        onHome(driverSig, inspectorSig);
    };

    const webStyle = `.m-signature-pad--footer {display: none; margin: 0px;} 
                    body,html {width: 100%; height: 100%; background-color: #fff;}`;

    return (
        <View
            style={[
                styles.screenBase,
                { justifyContent: 'center', alignItems: 'center', padding: 24 },
            ]}>
            <Modal
                visible={showSignatureModal}
                animationType="fade"
                transparent={true}>
                <View
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(0,0,0,0.85)',
                        justifyContent: 'center',
                        padding: 20,
                    }}>
                    <View
                        style={{
                            backgroundColor: 'white',
                            height: 480,
                            borderRadius: 12,
                            overflow: 'hidden',
                        }}>
                        <Text
                            style={{
                                textAlign: 'center',
                                padding: 15,
                                color: '#333',
                                fontWeight: 'bold',
                                backgroundColor: '#f3f4f6',
                            }}>
                            {signerType === 'driver'
                                ? 'DRIVER SIGNATURE'
                                : 'INSPECTOR SIGNATURE'}
                        </Text>
                        <View style={{ flex: 1 }}>
                            <SignatureScreen
                                ref={signatureRef}
                                onOK={handleSignatureOK}
                                onEmpty={() =>
                                    Alert.alert(
                                        'Empty Signature',
                                        'Please sign before submitting.'
                                    )
                                }
                                descriptionText={
                                    signerType === 'driver'
                                        ? 'Driver signs here'
                                        : 'Inspector signs here'
                                }
                                webStyle={webStyle}
                            />
                        </View>
                        <View
                            style={{
                                flexDirection: 'row',
                                borderTopWidth: 1,
                                borderTopColor: '#eee',
                            }}>
                            <TouchableOpacity
                                onPress={handleClear}
                                style={{
                                    flex: 1,
                                    backgroundColor: '#fca5a5',
                                    padding: 18,
                                    alignItems: 'center',
                                    borderRightWidth: 1,
                                    borderColor: '#fff',
                                }}>
                                <Text style={{ color: '#7f1d1d', fontWeight: 'bold' }}>
                                    CLEAR
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleSubmitPad}
                                style={{
                                    flex: 1,
                                    backgroundColor: '#22c55e',
                                    padding: 18,
                                    alignItems: 'center',
                                }}>
                                <Text style={{ color: 'white', fontWeight: 'bold' }}>
                                    SAVE SIGNATURE
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity
                            onPress={() => setShowSignatureModal(false)}
                            style={{
                                backgroundColor: '#333',
                                padding: 12,
                                alignItems: 'center',
                            }}>
                            <Text style={{ color: '#9ca3af', fontSize: 12 }}>CANCEL</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <View style={[styles.summaryRing, { borderColor: summaryColor }]}>
                <Icon size={64} color={summaryColor} />
            </View>

            <Text
                style={{
                    color: COLORS.white,
                    fontSize: 24,
                    fontWeight: 'bold',
                    marginBottom: 10,
                }}>
                Inspection Complete
            </Text>

            <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                    <Text style={{ color: COLORS.gray }}>Issues Found</Text>
                    <Text style={{ color: summaryColor, fontWeight: 'bold' }}>
                        {issues.length}
                    </Text>
                </View>
                <View style={[styles.summaryRow, { borderBottomWidth: 0 }]}>
                    <Text style={{ color: COLORS.gray }}>Result</Text>
                    <Text style={{ color: summaryColor, fontWeight: 'bold' }}>
                        {summaryText}
                    </Text>
                </View>
            </View>

            <View style={{ width: '100%', gap: 15 }}>
                <TouchableOpacity
                    style={[
                        styles.primaryButton,
                        {
                            backgroundColor: driverSig ? '#134e4a' : COLORS.grayDark,
                            borderWidth: 1,
                            borderColor: driverSig ? COLORS.tealLight : '#444',
                        },
                    ]}
                    onPress={() => openSignaturePad('driver')}>
                    {driverSig ? (
                        <CheckCircle
                            size={20}
                            color={COLORS.tealLight}
                            style={{ marginRight: 10 }}
                        />
                    ) : (
                        <User size={20} color="white" style={{ marginRight: 10 }} />
                    )}
                    <Text style={styles.primaryButtonText}>
                        {driverSig ? 'DRIVER SIGNED' : 'SIGN AS DRIVER'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.primaryButton,
                        {
                            backgroundColor: inspectorSig ? '#134e4a' : COLORS.grayDark,
                            borderWidth: 1,
                            borderColor: inspectorSig ? COLORS.tealLight : '#444',
                        },
                    ]}
                    onPress={() => openSignaturePad('inspector')}>
                    {inspectorSig ? (
                        <CheckCircle
                            size={20}
                            color={COLORS.tealLight}
                            style={{ marginRight: 10 }}
                        />
                    ) : (
                        <Shield size={20} color="white" style={{ marginRight: 10 }} />
                    )}
                    <Text style={styles.primaryButtonText}>
                        {inspectorSig ? 'INSPECTOR SIGNED' : 'SIGN AS INSPECTOR'}
                    </Text>
                </TouchableOpacity>

                {driverSig && inspectorSig && (
                    <TouchableOpacity
                        style={[
                            styles.primaryButton,
                            { backgroundColor: COLORS.green, marginTop: 10 },
                        ]}
                        onPress={handleFinalSubmit}>
                        <FileText size={20} color="white" style={{ marginRight: 10 }} />
                        <Text style={styles.primaryButtonText}>FINISH & SAVE REPORT</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

export default SummaryScreen;

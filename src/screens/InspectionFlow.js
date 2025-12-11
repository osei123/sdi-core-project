import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Modal,
    Alert,
    ActivityIndicator,
    Image,
    Platform,
    KeyboardAvoidingView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
    ArrowLeft,
    CheckCircle,
    Octagon,
    X,
    FileText,
    Camera,
    Mic,
    AlertTriangle,
    XCircle,
} from 'lucide-react-native';
import { styles } from '../styles/globalStyles';
import { COLORS } from '../constants/colors';

const InspectionFlow = ({ data, onComplete, onCancel }) => {
    const [step, setStep] = useState(0);
    const [modalVisible, setModalVisible] = useState(false);
    const [responses, setResponses] = useState([]);

    // AI Logic State
    const [defectDesc, setDefectDesc] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [defectImage, setDefectImage] = useState(null);
    const [aiAnalysis, setAiAnalysis] = useState(null);

    const handleBack = () => {
        if (step > 0) {
            setStep(step - 1);
            setResponses((prev) => prev.slice(0, -1));
        } else {
            onCancel();
        }
    };

    const currentItem = data[step];
    const progress = (step / data.length) * 100;

    const handleNext = (status, severity = null, note = null) => {
        const finalNote = status === 'FAIL' ? note : null;

        const newRes = [
            ...responses,
            {
                id: currentItem.id,
                title: currentItem.title,
                desc: currentItem.desc,
                status,
                severity,
                note: finalNote,
                image: defectImage,
            },
        ];
        setResponses(newRes);
        setModalVisible(false);
        setDefectDesc('');
        setDefectImage(null);
        setAiAnalysis(null);
        if (step < data.length - 1) {
            setStep(step + 1);
        } else {
            onComplete(newRes);
        }
    };

    const runAiAnalysis = async () => {
        setIsAnalyzing(true);
        setTimeout(() => {
            setIsAnalyzing(false);
            const isSevere =
                defectDesc.toLowerCase().includes('leak') ||
                defectDesc.toLowerCase().includes('brake');
            setAiAnalysis({
                severity: isSevere ? 'CRITICAL (Red)' : 'MINOR (Yellow)',
                reason: isSevere ? 'Safety risk detected.' : 'Appearance issue only.',
            });
        }, 1500);
    };

    const handleCameraCapture = async () => {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        if (permissionResult.granted === false) {
            Alert.alert(
                'Permission Required',
                'Camera access is needed to add photos.'
            );
            return;
        }
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            aspect: [4, 3],
            quality: 0.5,
            base64: true,
        });
        if (!result.canceled) {
            setDefectImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
        }
    };

    const handleVoiceInput = () => {
        Alert.alert(
            'Voice Dictation',
            "Tap the 'Describe Issue' box, then use the Microphone 🎙️ on your keyboard."
        );
    };

    return (
        <View style={styles.screenBase}>
            <View
                style={[
                    styles.header,
                    {
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        paddingBottom: 0,
                    },
                ]}>
                <View
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        width: '100%',
                        marginBottom: 15,
                    }}>
                    <TouchableOpacity
                        onPress={handleBack}
                        style={{ flexDirection: 'row', alignItems: 'center', padding: 5 }}>
                        <ArrowLeft size={16} color={COLORS.white} />
                        <Text
                            style={{
                                color: COLORS.white,
                                marginLeft: 5,
                                fontWeight: 'bold',
                            }}>
                            {step === 0 ? 'Cancel' : 'Back'}
                        </Text>
                    </TouchableOpacity>
                    <Text style={{ color: COLORS.white }}>
                        Step {step + 1}/{data.length}
                    </Text>
                </View>
                <View
                    style={{
                        width: '100%',
                        height: 4,
                        backgroundColor: COLORS.grayDark,
                        borderRadius: 2,
                    }}>
                    <View
                        style={{
                            width: `${progress}%`,
                            height: '100%',
                            backgroundColor: COLORS.green,
                        }}
                    />
                </View>
            </View>

            <View style={{ flex: 1, padding: 24 }}>
                <View style={styles.inspectionCard}>
                    <Text style={styles.cardCategory}>{currentItem.category}</Text>
                    <Text style={styles.cardTitle}>{currentItem.title}</Text>
                    <Text style={styles.cardDesc}>{currentItem.desc}</Text>
                </View>

                <View style={{ marginTop: 'auto', gap: 15 }}>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: COLORS.green }]}
                        onPress={() => handleNext('PASS')}>
                        <View>
                            <Text style={styles.actionBtnTitle}>PASS / GREEN</Text>
                            <Text style={styles.actionBtnSub}>Condition Good</Text>
                        </View>
                        <CheckCircle size={28} color={COLORS.white} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: COLORS.red }]}
                        onPress={() => setModalVisible(true)}>
                        <View>
                            <Text style={styles.actionBtnTitle}>ISSUE / FAIL</Text>
                            <Text style={styles.actionBtnSub}>Tap to Log Defect</Text>
                        </View>
                        <Octagon size={28} color={COLORS.white} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* SEVERITY MODAL */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text
                                style={{ color: COLORS.red, fontWeight: 'bold', fontSize: 18 }}>
                                REPORTING DEFECT
                            </Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <X size={24} color={COLORS.white} />
                            </TouchableOpacity>
                        </View>

                        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                            <ScrollView>
                                <Text
                                    style={{
                                        color: COLORS.white,
                                        fontSize: 22,
                                        fontWeight: 'bold',
                                        marginBottom: 20,
                                    }}>
                                    {currentItem.title}
                                </Text>

                                <View style={styles.aiBox}>
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            gap: 8,
                                            marginBottom: 10,
                                        }}>
                                        <FileText size={18} color={COLORS.blue} />
                                        <Text
                                            style={{
                                                color: COLORS.blue,
                                                fontWeight: 'bold',
                                                fontSize: 12,
                                            }}>
                                            DESCRIBE THE ISSUE
                                        </Text>
                                    </View>
                                    <TextInput
                                        style={styles.aiInput}
                                        placeholder="Type notes here (e.g. 'Deep cut on left tire')..."
                                        placeholderTextColor="#666"
                                        multiline
                                        value={defectDesc}
                                        onChangeText={setDefectDesc}
                                    />
                                    <TouchableOpacity
                                        style={styles.aiBtn}
                                        onPress={runAiAnalysis}
                                        disabled={isAnalyzing}>
                                        {isAnalyzing ? (
                                            <ActivityIndicator size="small" color={COLORS.blue} />
                                        ) : (
                                            <Text style={styles.aiBtnText}>AI SUGGESTION ✨</Text>
                                        )}
                                    </TouchableOpacity>

                                    {aiAnalysis && (
                                        <View
                                            style={[
                                                styles.aiResult,
                                                {
                                                    borderColor: aiAnalysis.severity.includes('Red')
                                                        ? COLORS.red
                                                        : COLORS.yellow,
                                                },
                                            ]}>
                                            <Text style={{ color: COLORS.white, fontWeight: 'bold' }}>
                                                Recommendation: {aiAnalysis.severity}
                                            </Text>
                                            <Text style={{ color: COLORS.gray, fontSize: 12 }}>
                                                {aiAnalysis.reason}
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                <View
                                    style={{
                                        flexDirection: 'row',
                                        gap: 10,
                                        marginBottom: 20,
                                        marginTop: 10,
                                    }}>
                                    <TouchableOpacity
                                        style={{
                                            flex: 1,
                                            backgroundColor: '#333',
                                            padding: 12,
                                            borderRadius: 8,
                                            alignItems: 'center',
                                            flexDirection: 'row',
                                            justifyContent: 'center',
                                            borderWidth: 1,
                                            borderColor: defectImage ? COLORS.green : '#444',
                                        }}
                                        onPress={handleCameraCapture}>
                                        <Camera
                                            size={20}
                                            color={defectImage ? COLORS.green : COLORS.white}
                                            style={{ marginRight: 8 }}
                                        />
                                        <Text
                                            style={{
                                                color: defectImage ? COLORS.green : COLORS.white,
                                                fontWeight: 'bold',
                                            }}>
                                            {defectImage ? 'PHOTO ADDED' : 'ADD PHOTO'}
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={{
                                            flex: 1,
                                            backgroundColor: '#333',
                                            padding: 12,
                                            borderRadius: 8,
                                            alignItems: 'center',
                                            flexDirection: 'row',
                                            justifyContent: 'center',
                                            borderWidth: 1,
                                            borderColor: '#444',
                                        }}
                                        onPress={handleVoiceInput}>
                                        <Mic
                                            size={20}
                                            color={COLORS.blue}
                                            style={{ marginRight: 8 }}
                                        />
                                        <Text style={{ color: COLORS.white, fontWeight: 'bold' }}>
                                            DICTATE
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                {defectImage && (
                                    <View style={{ marginBottom: 20, alignItems: 'center' }}>
                                        <Image
                                            source={{ uri: defectImage }}
                                            style={{
                                                width: 200,
                                                height: 150,
                                                borderRadius: 10,
                                                borderWidth: 1,
                                                borderColor: COLORS.gray,
                                            }}
                                        />
                                        <TouchableOpacity
                                            onPress={() => setDefectImage(null)}
                                            style={{ marginTop: 5 }}>
                                            <Text style={{ color: COLORS.red, fontSize: 12 }}>
                                                Remove Photo
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                )}

                                <Text style={styles.label}>SELECT SEVERITY TO SAVE</Text>

                                <TouchableOpacity
                                    style={[styles.severityBtn, { backgroundColor: COLORS.yellow }]}
                                    onPress={() => handleNext('FAIL', 'MINOR', defectDesc)}>
                                    <View
                                        style={[
                                            styles.iconCircle,
                                            { backgroundColor: 'rgba(0,0,0,0.2)' },
                                        ]}>
                                        <AlertTriangle size={20} color={COLORS.black} />
                                    </View>
                                    <View>
                                        <Text
                                            style={{
                                                color: COLORS.black,
                                                fontWeight: 'bold',
                                                fontSize: 16,
                                            }}>
                                            MINOR (Yellow)
                                        </Text>
                                        <Text style={{ color: 'rgba(0,0,0,0.6)', fontSize: 12 }}>
                                            Safe to drive. Monitor.
                                        </Text>
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.severityBtn, { backgroundColor: COLORS.red }]}
                                    onPress={() => handleNext('FAIL', 'CRITICAL', defectDesc)}>
                                    <View
                                        style={[
                                            styles.iconCircle,
                                            { backgroundColor: 'rgba(0,0,0,0.2)' },
                                        ]}>
                                        <XCircle size={20} color={COLORS.white} />
                                    </View>
                                    <View>
                                        <Text
                                            style={{
                                                color: COLORS.white,
                                                fontWeight: 'bold',
                                                fontSize: 16,
                                            }}>
                                            CRITICAL (Red)
                                        </Text>
                                        <Text
                                            style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
                                            Unsafe. GROUND VEHICLE.
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                                </ScrollView>
                        </KeyboardAvoidingView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default InspectionFlow;

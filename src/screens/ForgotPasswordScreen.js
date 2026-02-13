import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    ScrollView,
    Platform,
} from 'react-native';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react-native';
import { styles } from '../styles/globalStyles';
import { COLORS } from '../constants/colors';

const ForgotPasswordScreen = ({ onBack, onReset }) => {
    const [step, setStep] = useState(1); // 1: Input, 2: Success
    const [contact, setContact] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleSendCode = async () => {
        if (!contact.includes('@')) {
            Alert.alert('Invalid Input', 'Please enter a valid email address.');
            return;
        }

        setIsSending(true);
        const result = await onReset(contact);
        setIsSending(false);

        if (result === 'email') {
            setStep(2);
        }
    };

    const renderInputStep = () => (
        <View style={{ width: '100%', gap: 20 }}>
            <View>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputWrapper}>
                    <Mail size={20} color={COLORS.tealLight} style={{ marginRight: 10 }} />
                    <TextInput
                        placeholder="name@company.com"
                        keyboardType="email-address"
                        placeholderTextColor={COLORS.tealMid}
                        style={styles.input}
                        value={contact}
                        onChangeText={setContact}
                        autoCapitalize="none"
                    />
                </View>
            </View>
            <TouchableOpacity style={styles.primaryButton} onPress={handleSendCode} disabled={isSending}>
                {isSending ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.primaryButtonText}>SEND RESET LINK</Text>}
            </TouchableOpacity>
        </View>
    );

    const renderSuccessStep = () => (
        <View style={{ width: '100%', gap: 20, alignItems: 'center' }}>
            <View style={{
                width: 80, height: 80, borderRadius: 40,
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                alignItems: 'center', justifyContent: 'center',
                marginBottom: 10, marginTop: 10
            }}>
                <CheckCircle size={40} color={COLORS.green} />
            </View>

            <Text style={[styles.authTitle, { fontSize: 22 }]}>Check Your Email</Text>

            <Text style={[styles.authSubtitle, { textAlign: 'center' }]}>
                We've sent a password reset link to{'\n'}
                <Text style={{ color: COLORS.tealLight, fontWeight: 'bold' }}>{contact}</Text>
            </Text>

            <Text style={{ color: COLORS.gray, textAlign: 'center', marginTop: 5, lineHeight: 22, fontSize: 14 }}>
                Please click the link in the email to reset your password.{'\n'}
                You will be redirected to our secure web portal to complete the process.
            </Text>

            <TouchableOpacity style={[styles.primaryButton, { marginTop: 20, width: '100%' }]} onPress={onBack}>
                <Text style={styles.primaryButtonText}>BACK TO LOGIN</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.authContainer}>
            <View style={styles.headerCurve} />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} showsVerticalScrollIndicator={false}>
                    <View style={styles.authContent}>
                        <TouchableOpacity onPress={onBack} style={{ marginBottom: 20 }}>
                            <ArrowLeft size={24} color={COLORS.white} />
                        </TouchableOpacity>

                        {step === 1 && (
                            <>
                                <Text style={styles.authTitle}>Reset Password</Text>
                                <Text style={styles.authSubtitle}>
                                    Enter your email address to receive a reset link.
                                </Text>
                                {renderInputStep()}
                            </>
                        )}

                        {step === 2 && renderSuccessStep()}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

export default ForgotPasswordScreen;

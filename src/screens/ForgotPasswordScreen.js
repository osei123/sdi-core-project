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
import { ArrowLeft, Mail, CheckCircle, Key, Lock, Eye, EyeOff } from 'lucide-react-native';
import { styles } from '../styles/globalStyles';
import { COLORS } from '../constants/colors';
import { validatePassword } from '../utils/passwordValidation';

const ForgotPasswordScreen = ({ onBack, onComplete, onReset, onVerify, onUpdate }) => {
    const [step, setStep] = useState(1); // 1: Contact, 2: OTP, 3: New Password
    const [contact, setContact] = useState('');
    const [contactType, setContactType] = useState('email'); // 'email' or 'sms'
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isSending, setIsSending] = useState(false);

    // Password validation state
    const [validation, setValidation] = useState(validatePassword(''));
    const [showPassword, setShowPassword] = useState(false);

    const handleSendCode = async () => {
        // Simple validation: Email needs @, Phone needs digits
        if (!contact.includes('@') && contact.replace(/\D/g, '').length < 8) {
            Alert.alert('Invalid Input', 'Please enter a valid email or phone number.');
            return;
        }

        setIsSending(true);
        const type = await onReset(contact);
        setIsSending(false);
        if (type) {
            setContactType(type);
            setStep(2);
        }
    };

    const handleVerifyCode = async () => {
        if (otp.length < 6) {
            Alert.alert('Invalid Code', 'Please enter the 6-digit code.');
            return;
        }
        setIsSending(true);
        const success = await onVerify(contact, otp, contactType);
        setIsSending(false);
        if (success) setStep(3);
    };

    const handleUpdatePass = async () => {
        if (!validation.isValid) {
            Alert.alert('Weak Password', 'Please ensure your password meets requirements.');
            return;
        }
        setIsSending(true);
        const success = await onUpdate(newPassword);
        setIsSending(false);
        if (success) onComplete();
    };

    const renderStep1 = () => (
        <View style={{ width: '100%', gap: 20 }}>
            <View>
                <Text style={styles.label}>Email or Phone Number</Text>
                <View style={styles.inputWrapper}>
                    <Mail size={20} color={COLORS.tealLight} style={{ marginRight: 10 }} />
                    <TextInput
                        placeholder="name@example.com or +1234567890"
                        keyboardType="email-address" // 'email-address' usually works fine for numbers too on mobile
                        placeholderTextColor={COLORS.tealMid}
                        style={styles.input}
                        value={contact}
                        onChangeText={setContact}
                        autoCapitalize="none"
                    />
                </View>
            </View>
            <TouchableOpacity style={styles.primaryButton} onPress={handleSendCode} disabled={isSending}>
                {isSending ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.primaryButtonText}>SEND CODE</Text>}
            </TouchableOpacity>
        </View>
    );

    const renderStep2 = () => (
        <View style={{ width: '100%', gap: 20 }}>
            <View>
                <Text style={styles.label}>Enter 6-Digit Code</Text>
                <View style={styles.inputWrapper}>
                    <Key size={20} color={COLORS.tealLight} style={{ marginRight: 10 }} />
                    <TextInput
                        placeholder="123456"
                        keyboardType="number-pad"
                        placeholderTextColor={COLORS.tealMid}
                        style={[styles.input, { letterSpacing: 5, fontSize: 18 }]}
                        value={otp}
                        onChangeText={setOtp}
                        maxLength={6}
                    />
                </View>
            </View>
            <TouchableOpacity style={styles.primaryButton} onPress={handleVerifyCode} disabled={isSending}>
                {isSending ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.primaryButtonText}>VERIFY CODE</Text>}
            </TouchableOpacity>
        </View>
    );

    const renderStep3 = () => (
        <View style={{ width: '100%', gap: 20 }}>
            <View>
                <Text style={styles.label}>New Password</Text>
                <View style={styles.inputWrapper}>
                    <Lock size={20} color={COLORS.tealLight} style={{ marginRight: 10 }} />
                    <TextInput
                        placeholder="New Password"
                        secureTextEntry={!showPassword}
                        placeholderTextColor={COLORS.tealMid}
                        style={styles.input}
                        value={newPassword}
                        onChangeText={(text) => {
                            setNewPassword(text);
                            setValidation(validatePassword(text));
                        }}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff size={20} color={COLORS.tealLight} /> : <Eye size={20} color={COLORS.tealLight} />}
                    </TouchableOpacity>
                </View>
                {/* Strength Indicator */}
                {newPassword.length > 0 && (
                    <View style={{ marginTop: 10, backgroundColor: 'rgba(0,0,0,0.2)', padding: 10, borderRadius: 8 }}>
                        <Text style={{ color: COLORS.tealLight, marginBottom: 5, fontSize: 12 }}>
                            Strength: <Text style={{ fontWeight: 'bold' }}>{validation.strength}</Text>
                        </Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                            <RuleItem label="8+ chars" satisfied={validation.rules.minLength} />
                            <RuleItem label="Uppercase" satisfied={validation.rules.hasUpper} />
                            <RuleItem label="Lowercase" satisfied={validation.rules.hasLower} />
                            <RuleItem label="Number" satisfied={validation.rules.hasNumber} />
                            <RuleItem label="Symbol" satisfied={validation.rules.hasSymbol} />
                        </View>
                    </View>
                )}
            </View>
            <TouchableOpacity style={styles.primaryButton} onPress={handleUpdatePass} disabled={isSending}>
                {isSending ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.primaryButtonText}>UPDATE PASSWORD</Text>}
            </TouchableOpacity>
        </View>
    );

    const RuleItem = ({ label, satisfied }) => (
        <View style={{ flexDirection: 'row', alignItems: 'center', opacity: satisfied ? 1 : 0.5 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: satisfied ? COLORS.green : COLORS.gray, marginRight: 4 }} />
            <Text style={{ color: satisfied ? COLORS.white : COLORS.gray, fontSize: 11 }}>{label}</Text>
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

                        <Text style={styles.authTitle}>Reset Password</Text>
                        <Text style={styles.authSubtitle}>
                            {step === 1 && "Enter your email or phone number to receive a code."}
                            {step === 2 && `Enter the 6-digit code sent to your ${contactType === 'email' ? 'email' : 'phone'}.`}
                            {step === 3 && "Create a new strong password."}
                        </Text>

                        {step === 1 && renderStep1()}
                        {step === 2 && renderStep2()}
                        {step === 3 && renderStep3()}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

export default ForgotPasswordScreen;

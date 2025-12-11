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

const ForgotPasswordScreen = ({ onBack, onComplete }) => {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [isSending, setIsSending] = useState(false); // Track if we are currently "sending"

    const handleReset = () => {
        // 1. Check if empty
        if (!email.trim()) {
            Alert.alert('Error', 'Please enter your email address.');
            return;
        }
        // 2. Check if it looks like an email (has @ and .)
        if (!email.includes('@') || !email.includes('.')) {
            Alert.alert('Invalid Email', 'Please enter a valid email address.');
            return;
        }

        // 3. Simulate "Sending..." delay
        setIsSending(true);
        setTimeout(() => {
            setIsSending(false);
            setSent(true);
        }, 2000); // 2 second delay
    };

    return (
        <View style={styles.authContainer}>
            <View style={styles.headerCurve} />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} showsVerticalScrollIndicator={false}>
                    <View style={styles.authContent}>
                        <TouchableOpacity onPress={onBack} style={{ marginBottom: 20 }}>
                            <ArrowLeft size={24} color={COLORS.white} />
                        </TouchableOpacity>

                        <Text style={styles.authTitle}>Reset Password</Text>
                        <Text style={styles.authSubtitle}>
                            Enter your email to receive a reset link.
                        </Text>

                        {!sent ? (
                            <View style={{ width: '100%', gap: 20 }}>
                                <View>
                                    <Text style={styles.label}>Email Address</Text>
                                    <View style={styles.inputWrapper}>
                                        <Mail
                                            size={20}
                                            color={COLORS.tealLight}
                                            style={{ marginRight: 10 }}
                                        />
                                        <TextInput
                                            placeholder="@company.com"
                                            keyboardType="email-address"
                                            placeholderTextColor={COLORS.tealMid}
                                            style={styles.input}
                                            value={email}
                                            onChangeText={setEmail}
                                        />
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={styles.primaryButton}
                                    onPress={handleReset}
                                    disabled={isSending}>
                                    {isSending ? (
                                        <ActivityIndicator color={COLORS.white} />
                                    ) : (
                                        <Text style={styles.primaryButtonText}>SEND RESET LINK</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View
                                style={{
                                    alignItems: 'center',
                                    padding: 20,
                                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                                    borderRadius: 12,
                                    borderWidth: 1,
                                    borderColor: COLORS.green,
                                }}>
                                <CheckCircle
                                    size={48}
                                    color={COLORS.green}
                                    style={{ marginBottom: 10 }}
                                />
                                <Text
                                    style={{
                                        color: COLORS.white,
                                        fontWeight: 'bold',
                                        fontSize: 18,
                                        marginBottom: 5,
                                    }}>
                                    Check your Email
                                </Text>
                                <Text style={{ color: COLORS.gray, textAlign: 'center' }}>
                                    We sent a secure link to:{'\n'}
                                    <Text style={{ color: COLORS.tealLight, fontWeight: 'bold' }}>
                                        {email}
                                    </Text>
                                </Text>
                                <TouchableOpacity
                                    style={[styles.primaryButton, { marginTop: 20, width: '100%' }]}
                                    onPress={onComplete}>
                                    <Text style={styles.primaryButtonText}>RETURN TO LOGIN</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

export default ForgotPasswordScreen;

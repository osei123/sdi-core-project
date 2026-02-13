import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    ScrollView,
    Platform,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { Mail, Lock, Shield, Fingerprint, Eye, EyeOff } from 'lucide-react-native';
import { styles } from '../styles/globalStyles';
import { COLORS } from '../constants/colors';

const AuthScreen = ({
    onLogin,
    onSignup,
    onForgotPassword,
    savedCredentials,
}) => {
    // Manager toggle removed - role is determined by backend profile
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isBiometricSupported, setIsBiometricSupported] = useState(false);

    useEffect(() => {
        (async () => {
            const compatible = await LocalAuthentication.hasHardwareAsync();
            const enrolled = await LocalAuthentication.isEnrolledAsync();
            setIsBiometricSupported(compatible && enrolled);
        })();
    }, []);

    const ALLOWED_DOMAINS = ['@jpghana.com', '@juwelenergy.com'];

    const handleLoginAttempt = () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Access Denied', 'Please enter both Email and Password.');
            return;
        }

        const isValidDomain = ALLOWED_DOMAINS.some(domain => email.toLowerCase().endsWith(domain));
        if (!isValidDomain) {
            Alert.alert('Restricted Access', 'Login is limited to authorized domains only.');
            return;
        }

        onLogin(email, password);
    };

    const handleBiometricAuth = async () => {
        // 1. Check if a user has actually enabled it
        if (!savedCredentials) {
            Alert.alert(
                'Biometrics Not Set',
                'Please login or register with a password first to enable this feature.'
            );
            return;
        }

        // 2. Scan Fingerprint/Face
        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: `Login`,
            fallbackLabel: 'Use Password',
        });

        if (result.success) {
            // 3. Login using the SAVED username (email) and password
            onLogin(
                savedCredentials.username, // usage of 'username' key in biometrics struct might need migration to 'email' later
                savedCredentials.password
            );
        } else {
            Alert.alert('Failed', 'Biometric authentication failed.');
        }
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
                        <Text style={styles.authTitle}>Welcome Back</Text>
                        <Text style={styles.authSubtitle}>Sign in to continue inspection</Text>

                        <View style={{ width: '100%', gap: 20 }}>
                            {/* Email Input */}
                            <View>
                                <Text style={styles.label}>Email Address</Text>
                                <View style={styles.inputWrapper}>
                                    <Mail
                                        size={20}
                                        color={COLORS.tealLight}
                                        style={{ marginRight: 10 }}
                                    />
                                    <TextInput
                                        placeholder="Enter Email"
                                        placeholderTextColor={COLORS.tealMid}
                                        style={styles.input}
                                        value={email}
                                        onChangeText={setEmail}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                    />
                                </View>
                            </View>

                            {/* Password Input */}
                            <View>
                                <Text style={styles.label}>Password</Text>
                                <View style={styles.inputWrapper}>
                                    <Lock
                                        size={20}
                                        color={COLORS.tealLight}
                                        style={{ marginRight: 10 }}
                                    />
                                    <TextInput
                                        placeholder="Password"
                                        secureTextEntry={!isPasswordVisible}
                                        placeholderTextColor={COLORS.tealMid}
                                        style={[styles.input, { flex: 1 }]}
                                        value={password}
                                        onChangeText={setPassword}
                                    />
                                    <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                                        {isPasswordVisible ? (
                                            <EyeOff size={20} color={COLORS.tealLight} />
                                        ) : (
                                            <Eye size={20} color={COLORS.tealLight} />
                                        )}
                                    </TouchableOpacity>
                                </View>
                                <TouchableOpacity
                                    style={{ alignSelf: 'flex-end', marginTop: 10 }}
                                    onPress={onForgotPassword}>
                                    <Text style={{ color: COLORS.tealLight, fontSize: 12 }}>
                                        Forgot Password?
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* Main Login Button */}
                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={handleLoginAttempt}>
                                <Shield size={20} color={COLORS.white} style={{ marginRight: 8 }} />
                                <Text style={styles.primaryButtonText}>SECURE LOGIN</Text>
                            </TouchableOpacity>

                            {/* === BIOMETRIC UI === */}
                            {isBiometricSupported && (
                                <View style={{ alignItems: 'center', marginTop: 30 }}>
                                    <Text
                                        style={{
                                            color: COLORS.tealLight,
                                            fontSize: 16,
                                            marginBottom: 20,
                                        }}>
                                        Or sign in with
                                    </Text>

                                    <TouchableOpacity
                                        onPress={handleBiometricAuth}
                                        style={{
                                            width: 64,
                                            height: 64,
                                            borderRadius: 32,
                                            backgroundColor: '#0f2928',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderWidth: 1,
                                            borderColor: '#185d59',
                                        }}>
                                        <Fingerprint size={32} color={COLORS.white} />
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Create Account Link */}
                            <TouchableOpacity
                                style={{ alignItems: 'center', marginTop: 20 }}
                                onPress={onSignup}>
                                <Text style={{ color: COLORS.gray }}>
                                    New User?{' '}
                                    <Text style={{ color: COLORS.tealLight, fontWeight: 'bold' }}>
                                        Create Account
                                    </Text>
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View >
    );
};

export default AuthScreen;

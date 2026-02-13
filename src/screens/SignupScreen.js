import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    ScrollView,
    Platform,
} from 'react-native';
import * as Location from 'expo-location';
import {
    ArrowLeft,
    User,
    Hash,
    Mail,
    Lock,
    UserPlus,
    Phone,
    Key,
    Eye,
    EyeOff
} from 'lucide-react-native';
import { styles } from '../styles/globalStyles';
import { COLORS } from '../constants/colors';
import { validatePassword } from '../utils/passwordValidation';

const SignupScreen = ({ onRegister, onVerifySignup, onBack }) => {
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [isManager, setIsManager] = useState(false);

    const [staffId, setStaffId] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [passwordValidation, setPasswordValidation] = useState(validatePassword(''));
    const [isRegistering, setIsRegistering] = useState(false);



    const handlePasswordChange = (text) => {
        setPassword(text);
        setPasswordValidation(validatePassword(text));
    };

    const handleRegisterAttempt = async () => {
        // 1. Basic Validation
        if (
            !fullName.trim() ||
            !username.trim() ||
            !email.trim() ||
            !password.trim()
        ) {
            Alert.alert('Incomplete', 'Please fill in all required fields.');
            return;
        }



        if (!passwordValidation.isValid) {
            Alert.alert('Weak Password', 'Please ensure your password meets all security requirements.');
            return;
        }

        setIsRegistering(true); // Start loading spinner

        // 3. CAPTURE GPS LOCATION (Optimized for Speed)
        let locationStamp = 'Location Unavailable';

        try {
            const { status } = await Location.requestForegroundPermissionsAsync();

            if (status === 'granted') {
                // FIX: We use 'Balanced' accuracy instead of default 'Highest'.
                // This is much faster (approx 0.5s vs 5.0s).
                let location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });

                // We try to get the address name
                let address = await Location.reverseGeocodeAsync(location.coords);
                if (address.length > 0) {
                    const area = address[0];
                    locationStamp = `${area.city || area.name}, ${area.region || ''}`;
                }
            }
        } catch (error) {
            console.log('GPS Error or Timeout: ', error);
            // Even if GPS fails, we continue! We don't stop the user.
            locationStamp = 'GPS Unavailable';
        }

        // 4. Send Data to App
        await onRegister({
            name: fullName,
            username: username,
            staffId: staffId,
            email: email,
            password: password,
            registeredLocation: locationStamp,
            role: isManager ? 'manager' : 'inspector',
        });

        setIsRegistering(false); // Stop loading
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

                        <Text style={styles.authTitle}>Create Account</Text>
                        <Text style={styles.authSubtitle}>
                            Join the Smart Digital Inspection Core
                        </Text>
                        <View style={{ width: '100%', gap: 15 }}>
                            {/* Form Inputs */}
                            <View>
                                <Text style={styles.label}>Full Name *</Text>
                                <View style={styles.inputWrapper}>
                                    <User
                                        size={20}
                                        color={COLORS.tealLight}
                                        style={{ marginRight: 10 }}
                                    />
                                    <TextInput
                                        placeholder="Enter Fullname"
                                        placeholderTextColor={COLORS.tealMid}
                                        style={styles.input}
                                        value={fullName}
                                        onChangeText={setFullName}
                                    />
                                </View>
                            </View>

                            <View>
                                <Text style={styles.label}>Username *</Text>
                                <View style={styles.inputWrapper}>
                                    <User
                                        size={20}
                                        color={COLORS.tealLight}
                                        style={{ marginRight: 10 }}
                                    />
                                    <TextInput
                                        placeholder="enter username"
                                        placeholderTextColor={COLORS.tealMid}
                                        style={styles.input}
                                        value={username}
                                        onChangeText={setUsername}
                                        autoCapitalize="none"
                                    />
                                </View>
                            </View>

                            <View>
                                <Text style={styles.label}>Staff ID (Optional)</Text>
                                <View style={styles.inputWrapper}>
                                    <Hash
                                        size={20}
                                        color={COLORS.tealLight}
                                        style={{ marginRight: 10 }}
                                    />
                                    <TextInput
                                        placeholder="Badge #000"
                                        placeholderTextColor={COLORS.tealMid}
                                        style={styles.input}
                                        value={staffId}
                                        onChangeText={setStaffId}
                                    />
                                </View>
                            </View>



                            <View>
                                <Text style={styles.label}>Email Address *</Text>
                                <View style={styles.inputWrapper}>
                                    <Mail
                                        size={20}
                                        color={COLORS.tealLight}
                                        style={{ marginRight: 10 }}
                                    />
                                    <TextInput
                                        placeholder="email@company.com"
                                        keyboardType="email-address"
                                        placeholderTextColor={COLORS.tealMid}
                                        style={styles.input}
                                        value={email}
                                        onChangeText={setEmail}
                                        autoCapitalize="none"
                                    />
                                </View>
                            </View>

                            <View>
                                <Text style={styles.label}>Set Password *</Text>
                                <View style={styles.inputWrapper}>
                                    <Lock
                                        size={20}
                                        color={COLORS.tealLight}
                                        style={{ marginRight: 10 }}
                                    />
                                    <TextInput
                                        placeholder=" "
                                        secureTextEntry={!isPasswordVisible}
                                        placeholderTextColor={COLORS.tealMid}
                                        style={[styles.input, { flex: 1 }]}
                                        value={password}
                                        onChangeText={handlePasswordChange}
                                    />
                                    <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                                        {isPasswordVisible ? (
                                            <EyeOff size={20} color={COLORS.tealLight} />
                                        ) : (
                                            <Eye size={20} color={COLORS.tealLight} />
                                        )}
                                    </TouchableOpacity>
                                </View>
                                {/* Password Strength Indicator */}
                                {password.length > 0 && (
                                    <View style={{ marginTop: 10, backgroundColor: 'rgba(0,0,0,0.2)', padding: 10, borderRadius: 8 }}>
                                        <Text style={{ color: COLORS.tealLight, marginBottom: 5, fontSize: 12 }}>
                                            Strength: <Text style={{ fontWeight: 'bold' }}>{passwordValidation.strength}</Text>
                                        </Text>
                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                                            <RuleItem label="8+ chars" satisfied={passwordValidation.rules.minLength} />
                                            <RuleItem label="Uppercase" satisfied={passwordValidation.rules.hasUpper} />
                                            <RuleItem label="Lowercase" satisfied={passwordValidation.rules.hasLower} />
                                            <RuleItem label="Number" satisfied={passwordValidation.rules.hasNumber} />
                                            <RuleItem label="Symbol" satisfied={passwordValidation.rules.hasSymbol} />
                                        </View>
                                    </View>
                                )}
                            </View>
                            {/* --- ROLE SELECTION TOGGLE --- */}
                            <View style={{ marginBottom: 15 }}>
                                <Text style={styles.label}>SELECT ACCOUNT TYPE</Text>
                                <TouchableOpacity
                                    style={styles.roleToggle}
                                    onPress={() => setIsManager(!isManager)}>
                                    <Text style={{ color: COLORS.tealLight, fontWeight: 'bold' }}>
                                        {isManager ? 'REGISTER AS MANAGER' : 'REGISTER AS INSPECTOR'}
                                    </Text>
                                    <View
                                        style={[
                                            styles.toggleSwitch,
                                            {
                                                backgroundColor: isManager
                                                    ? COLORS.tealLight
                                                    : COLORS.grayDark,
                                            },
                                        ]}>
                                        <View
                                            style={[
                                                styles.toggleKnob,
                                                { transform: [{ translateX: isManager ? 16 : 0 }] },
                                            ]}
                                        />
                                    </View>
                                </TouchableOpacity>
                            </View>
                            {/* ----------------------------- */}
                            {/* Register Button */}
                            <TouchableOpacity
                                style={[styles.primaryButton, { marginTop: 10 }]}
                                onPress={handleRegisterAttempt}
                                disabled={isRegistering} // Disable button while loading
                            >
                                {isRegistering ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <>
                                        <UserPlus
                                            size={20}
                                            color={COLORS.white}
                                            style={{ marginRight: 8 }}
                                        />
                                        <Text style={styles.primaryButtonText}>REGISTER ACCOUNT</Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={{ alignItems: 'center', marginTop: 10 }}
                                onPress={onBack}>
                                <Text style={{ color: COLORS.gray }}>
                                    Already have an account?{' '}
                                    <Text style={{ color: COLORS.tealLight, fontWeight: 'bold' }}>
                                        Login
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

const RuleItem = ({ label, satisfied }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', opacity: satisfied ? 1 : 0.5 }}>
        <View style={{
            width: 8, height: 8, borderRadius: 4,
            backgroundColor: satisfied ? COLORS.green : COLORS.gray,
            marginRight: 4
        }} />
        <Text style={{ color: satisfied ? COLORS.white : COLORS.gray, fontSize: 11 }}>
            {label}
        </Text>
    </View>
);

export default SignupScreen;


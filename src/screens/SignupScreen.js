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
} from 'lucide-react-native';
import { styles } from '../styles/globalStyles';
import { COLORS } from '../constants/colors';

const SignupScreen = ({ onRegister, onBack }) => {
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [isManager, setIsManager] = useState(false); // <--- Add this toggle state

    const [staffId, setStaffId] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false); // <--- Loading state

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

        setIsRegistering(true); // Start loading spinner

        // 2. CAPTURE GPS LOCATION (Optimized for Speed)
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

        // 3. Send Data to App
        onRegister({
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
                                        secureTextEntry
                                        placeholderTextColor={COLORS.tealMid}
                                        style={styles.input}
                                        value={password}
                                        onChangeText={setPassword}
                                    />
                                </View>
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
        </View>
    );
};

export default SignupScreen;


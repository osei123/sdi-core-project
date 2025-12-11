import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import {
    ArrowLeft,
    User,
    Hash,
    Mail,
    Lock,
    CheckCircle,
} from 'lucide-react-native';
import { styles } from '../styles/globalStyles';
import { COLORS } from '../constants/colors';

const EditProfileScreen = ({
    currentData,
    onSave,
    onBack,
    onForgotPassword,
}) => {
    const [form, setForm] = useState(currentData);

    return (
        <View style={styles.screenBase}>
            <View style={[styles.header, { justifyContent: 'flex-start', gap: 15 }]}>
                <TouchableOpacity onPress={onBack}>
                    <ArrowLeft size={24} color={COLORS.gray} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Profile</Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={{ padding: 24 }}>
                    <View style={{ alignItems: 'center', marginBottom: 30 }}>
                        <View
                            style={{
                                width: 100,
                                height: 100,
                                borderRadius: 50,
                                backgroundColor: COLORS.card,
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderWidth: 1,
                                borderColor: COLORS.tealMid,
                            }}>
                            <User size={50} color={COLORS.tealLight} />
                        </View>
                        <Text
                            style={{ color: COLORS.blue, marginTop: 10, fontWeight: 'bold' }}>
                            Change Photo
                        </Text>
                    </View>

                    <View style={{ gap: 20 }}>
                        <View>
                            <Text style={styles.label}>Full Name</Text>
                            <View style={styles.inputWrapper}>
                                <User
                                    size={20}
                                    color={COLORS.tealLight}
                                    style={{ marginRight: 10 }}
                                />
                                <TextInput
                                    value={form.name}
                                    onChangeText={(t) => setForm({ ...form, name: t })}
                                    placeholderTextColor={COLORS.tealMid}
                                    style={styles.input}
                                />
                            </View>
                        </View>

                        <View>
                            <Text style={styles.label}>Staff ID</Text>
                            <View style={styles.inputWrapper}>
                                <Hash
                                    size={20}
                                    color={COLORS.tealLight}
                                    style={{ marginRight: 10 }}
                                />
                                <TextInput
                                    value={form.id}
                                    onChangeText={(t) => setForm({ ...form, id: t })}
                                    placeholderTextColor={COLORS.tealMid}
                                    style={styles.input}
                                />
                            </View>
                        </View>

                        <View>
                            <Text style={styles.label}>Email Address</Text>
                            <View style={styles.inputWrapper}>
                                <Mail
                                    size={20}
                                    color={COLORS.tealLight}
                                    style={{ marginRight: 10 }}
                                />
                                <TextInput
                                    value={form.email}
                                    onChangeText={(t) => setForm({ ...form, email: t })}
                                    placeholderTextColor={COLORS.tealMid}
                                    style={styles.input}
                                    keyboardType="email-address"
                                />
                            </View>
                        </View>

                        {/* NEW: Security Section */}
                        <View
                            style={{
                                marginTop: 10,
                                paddingTop: 20,
                                borderTopWidth: 1,
                                borderTopColor: COLORS.grayDark,
                            }}>
                            <Text style={[styles.label, { color: COLORS.yellow }]}>
                                SECURITY
                            </Text>
                            <TouchableOpacity
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    paddingVertical: 15,
                                    backgroundColor: 'rgba(250, 204, 21, 0.1)',
                                    paddingHorizontal: 15,
                                    borderRadius: 8,
                                    marginTop: 5,
                                }}
                                onPress={onForgotPassword}>
                                <Lock
                                    size={20}
                                    color={COLORS.yellow}
                                    style={{ marginRight: 10 }}
                                />
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: COLORS.white, fontWeight: 'bold' }}>
                                        Reset Password
                                    </Text>
                                    <Text style={{ color: COLORS.gray, fontSize: 10 }}>
                                        Forgotten your password? Reset it via email.
                                    </Text>
                                </View>
                                <ArrowLeft
                                    size={16}
                                    color={COLORS.yellow}
                                    style={{ transform: [{ rotate: '180deg' }] }}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>

                <View style={styles.footerAction}>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => onSave(form)}>
                        <CheckCircle
                            size={20}
                            color={COLORS.white}
                            style={{ marginRight: 8 }}
                        />
                        <Text style={styles.primaryButtonText}>SAVE CHANGES</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

export default EditProfileScreen;

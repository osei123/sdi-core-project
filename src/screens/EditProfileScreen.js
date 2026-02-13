import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
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
    const { colors } = useTheme();
    const [form, setForm] = useState(currentData);

    return (
        <View style={[styles.screenBase, { backgroundColor: colors.bgPrimary }]}>
            <View style={[styles.header, {
                justifyContent: 'flex-start',
                gap: 15,
                backgroundColor: colors.bgSecondary,
                borderBottomColor: colors.border
            }]}>
                <TouchableOpacity onPress={onBack}>
                    <ArrowLeft size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Edit Profile</Text>
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
                                backgroundColor: colors.bgTertiary,
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderWidth: 1,
                                borderColor: colors.tealMid,
                            }}>
                            <User size={50} color={colors.tealLight} />
                        </View>
                        <Text
                            style={{ color: colors.blue, marginTop: 10, fontWeight: 'bold' }}>
                            Change Photo
                        </Text>
                    </View>

                    <View style={{ gap: 20 }}>
                        <View>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>Full Name</Text>
                            <View style={[styles.inputWrapper, { backgroundColor: colors.bgTertiary, borderColor: colors.border }]}>
                                <User
                                    size={20}
                                    color={colors.tealMid}
                                    style={{ marginRight: 10 }}
                                />
                                <TextInput
                                    value={form.name}
                                    onChangeText={(t) => setForm({ ...form, name: t })}
                                    placeholderTextColor={colors.textMuted}
                                    style={[styles.input, { color: colors.textPrimary }]}
                                />
                            </View>
                        </View>

                        <View>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>Staff ID</Text>
                            <View style={[styles.inputWrapper, { backgroundColor: colors.bgTertiary, borderColor: colors.border }]}>
                                <Hash
                                    size={20}
                                    color={colors.tealMid}
                                    style={{ marginRight: 10 }}
                                />
                                <TextInput
                                    value={form.id}
                                    onChangeText={(t) => setForm({ ...form, id: t })}
                                    placeholderTextColor={colors.textMuted}
                                    style={[styles.input, { color: colors.textPrimary }]}
                                />
                            </View>
                        </View>

                        <View>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>Email Address</Text>
                            <View style={[styles.inputWrapper, { backgroundColor: colors.bgTertiary, borderColor: colors.border }]}>
                                <Mail
                                    size={20}
                                    color={colors.tealMid}
                                    style={{ marginRight: 10 }}
                                />
                                <TextInput
                                    value={form.email}
                                    onChangeText={(t) => setForm({ ...form, email: t })}
                                    placeholderTextColor={colors.textMuted}
                                    style={[styles.input, { color: colors.textPrimary }]}
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
                                    <Text style={{ color: colors.textPrimary, fontWeight: 'bold' }}>
                                        Reset Password
                                    </Text>
                                    <Text style={{ color: colors.textMuted, fontSize: 10 }}>
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

                <View style={[styles.footerAction, { backgroundColor: colors.bgPrimary, borderTopColor: colors.border }]}>
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

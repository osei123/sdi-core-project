import React from 'react';
import { View, TouchableOpacity, Text, Alert } from 'react-native';
import { Home, History, FileText, HelpCircle } from 'lucide-react-native';
import { styles } from '../styles/globalStyles';
import { useTheme } from '../contexts/ThemeContext';

const BottomNav = ({ activeTab, onNavigate }) => {
    const { colors } = useTheme();

    const NavIcon = ({ icon: Icon, label, active }) => (
        <View style={{ alignItems: 'center' }}>
            <Icon size={20} color={active ? colors.blue : colors.textMuted} />
            <Text
                style={{
                    color: active ? colors.blue : colors.textMuted,
                    fontSize: 10,
                    marginTop: 4,
                    fontWeight: active ? 'bold' : 'normal',
                }}>
                {label}
            </Text>
        </View>
    );

    return (
        <View style={[styles.bottomNav, { backgroundColor: colors.bgSecondary, borderTopColor: colors.border }]}>
            {/* Home Button */}
            <TouchableOpacity
                onPress={() => onNavigate('home')}
                style={{ alignItems: 'center', flex: 1 }}>
                <NavIcon icon={Home} label="Home" active={activeTab === 'home'} />
            </TouchableOpacity>

            {/* History Button */}
            <TouchableOpacity
                onPress={() => onNavigate('history')}
                style={{ alignItems: 'center', flex: 1 }}>
                <NavIcon
                    icon={History}
                    label="History"
                    active={activeTab === 'history'}
                />
            </TouchableOpacity>

            <TouchableOpacity
                onPress={() => onNavigate('quality')}
                style={{ alignItems: 'center', flex: 1 }}>
                <NavIcon icon={FileText} label="Quality" active={activeTab === 'quality'} />
            </TouchableOpacity>

            <TouchableOpacity
                onPress={() => Alert.alert('Support', 'Call Dispatch?')}
                style={{ alignItems: 'center', flex: 1 }}>
                <NavIcon
                    icon={HelpCircle}
                    label="Support"
                    active={activeTab === 'support'}
                />
            </TouchableOpacity>
        </View>
    );
};

export default BottomNav;

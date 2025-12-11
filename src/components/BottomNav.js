import React from 'react';
import { View, TouchableOpacity, Text, Alert } from 'react-native';
import { Home, History, BookOpen, HelpCircle } from 'lucide-react-native';
import { styles } from '../styles/globalStyles';
import { COLORS } from '../constants/colors';

const NavIcon = ({ icon: Icon, label, active }) => (
    <View style={{ alignItems: 'center' }}>
        <Icon size={20} color={active ? COLORS.blue : COLORS.gray} />
        <Text
            style={{
                color: active ? COLORS.blue : COLORS.gray,
                fontSize: 10,
                marginTop: 4,
                fontWeight: active ? 'bold' : 'normal',
            }}>
            {label}
        </Text>
    </View>
);

const BottomNav = ({ activeTab, onNavigate }) => (
    <View style={styles.bottomNav}>
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
            onPress={() => Alert.alert('Coming Soon')}
            style={{ alignItems: 'center', flex: 1 }}>
            <NavIcon icon={BookOpen} label="Guides" active={activeTab === 'guides'} />
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

export default BottomNav;

import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const MenuItem = ({ icon: Icon, label, color, onPress }) => {
    const { colors } = useTheme();
    const finalColor = color || colors.textPrimary;

    return (
        <TouchableOpacity
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: colors.borderLight,
            }}
            onPress={onPress}>
            <View style={{ width: 40, alignItems: 'center' }}>
                <Icon size={22} color={finalColor} />
            </View>
            <Text style={{ color: finalColor, fontSize: 16, fontWeight: '500' }}>
                {label}
            </Text>
        </TouchableOpacity>
    );
};

export default MenuItem;

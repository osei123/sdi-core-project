import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { COLORS } from '../constants/colors';

const MenuItem = ({ icon: Icon, label, color = COLORS.white, onPress }) => (
    <TouchableOpacity
        style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: '#2a2a2a',
        }}
        onPress={onPress}>
        <View style={{ width: 40, alignItems: 'center' }}>
            <Icon size={22} color={color} />
        </View>
        <Text style={{ color: color, fontSize: 16, fontWeight: '500' }}>
            {label}
        </Text>
    </TouchableOpacity>
);

export default MenuItem;

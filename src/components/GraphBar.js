import React from 'react';
import { View, Text } from 'react-native';
import { COLORS } from '../constants/colors';

const GraphBar = ({ label, value, color, total }) => {
    const widthPercent = total > 0 ? (value / total) * 100 : 0;
    return (
        <View style={{ marginBottom: 15 }}>
            <View
                style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginBottom: 5,
                }}>
                <Text
                    style={{ color: COLORS.gray, fontSize: 12, fontWeight: 'bold' }}>
                    {label}
                </Text>
                <Text style={{ color: COLORS.white, fontWeight: 'bold' }}>
                    {value} ({Math.round(widthPercent)}%)
                </Text>
            </View>
            <View
                style={{
                    height: 10,
                    backgroundColor: '#333',
                    borderRadius: 5,
                    overflow: 'hidden',
                }}>
                <View
                    style={{
                        width: `${widthPercent}%`,
                        height: '100%',
                        backgroundColor: color,
                    }}
                />
            </View>
        </View>
    );
};

export default GraphBar;

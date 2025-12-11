import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Image } from 'react-native';
import { styles } from '../styles/globalStyles';
import { COLORS } from '../constants/colors';

const SplashScreen = () => {
    // Animation values
    const fadeAnim1 = useRef(new Animated.Value(0.3)).current;
    const fadeAnim2 = useRef(new Animated.Value(0.3)).current;
    const fadeAnim3 = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        // Only Animation Logic here. No navigation logic.
        const createDotAnimation = (animValue) => {
            return Animated.sequence([
                Animated.timing(animValue, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(animValue, {
                    toValue: 0.3,
                    duration: 400,
                    useNativeDriver: true,
                }),
            ]);
        };

        Animated.loop(
            Animated.stagger(200, [
                createDotAnimation(fadeAnim1),
                createDotAnimation(fadeAnim2),
                createDotAnimation(fadeAnim3),
            ])
        ).start();
    }, []);

    return (
        <View style={styles.splashContainer}>
            {/* 1. KEEPING THE ORIGINAL DECORATION (The large background circle) */}
            <View style={styles.splashDecoration} />

            <View style={styles.centerContent}>
                {/* 2. REMOVED "logoContainer" WRAPPER. Logo is now free. */}
                <Image
                    source={require('../../assets/LOGOBK1.png')}
                    style={{ width: 300, height: 400, resizeMode: 'contain' }}
                />
            </View>

            <View style={styles.splashTextContainer}>
                <Text style={styles.splashSubtitle}> </Text>
                <Text style={styles.splashSubtitle}> </Text>

                {/* Animated Dots */}
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 25 }}>
                    <Animated.View
                        style={[
                            styles.dot,
                            { backgroundColor: COLORS.tealLight, opacity: fadeAnim1 },
                        ]}
                    />
                    <Animated.View
                        style={[
                            styles.dot,
                            { backgroundColor: COLORS.tealLight, opacity: fadeAnim2 },
                        ]}
                    />
                    <Animated.View
                        style={[
                            styles.dot,
                            { backgroundColor: COLORS.tealLight, opacity: fadeAnim3 },
                        ]}
                    />
                </View>
            </View>

            <View style={styles.footerContainer}>
                <Text style={styles.footerText}>
                    Smart Vehicle Health & Compliance Ecosystem
                </Text>
                <Text style={styles.versionText}>v2.1 Fast-Load</Text>
            </View>
        </View>
    );
};

export default SplashScreen;

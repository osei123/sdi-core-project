import React, { useState, useRef } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Alert,
    Image,
    Animated,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { UserPlus, Globe, ArrowLeft } from 'lucide-react-native';
import { styles } from '../styles/globalStyles';

const { width } = Dimensions.get('window');

const OnboardingScreen = ({ onFinish, onLogin, onRegister }) => {
    // 1. We track the page index manually now
    const [currentIndex, setCurrentIndex] = useState(0);

    // 2. We use a "ref" to control the scrolling programmatically
    const scrollRef = useRef(null);

    // 3. Animation Value for the dots
    const scrollX = useRef(new Animated.Value(0)).current;

    const slides = [
        {
            id: 1,
            image: require('../../assets/onboard11.png'), // Adjusted path 
            title: 'Smart Inspections',
            desc: 'Streamline your vehicle checks with our advanced digital tools.',
        },
        {
            id: 2,
            image: require('../../assets/onboard2.png'), // Adjusted path
            title: 'Biometric Security',
            desc: 'Secure your inspection data using state-of-the-art fingerprint and face ID.',
        },
        {
            id: 3,
            image: require('../../assets/onboard3.png'), // Adjusted path
            title: 'Get Started',
            desc: 'Create an account or login to begin your truck inspection today.',
        },
    ];

    // 4. PRE-CALCULATED LOGIC
    // This function runs when you stop swiping to tell us which page we are on.
    const handleScrollEnd = (event) => {
        const contentOffsetX = event.nativeEvent.contentOffset.x;
        // We divide the offset by the screen width to get 0, 1, or 2
        const finalIndex = Math.round(contentOffsetX / width);
        setCurrentIndex(finalIndex);
    };

    const handleNext = () => {
        if (currentIndex < slides.length - 1) {
            // Scroll to the next width chunk
            scrollRef.current.scrollTo({
                x: (currentIndex + 1) * width,
                animated: true,
            });
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handleBack = () => {
        if (currentIndex > 0) {
            scrollRef.current.scrollTo({
                x: (currentIndex - 1) * width,
                animated: true,
            });
            setCurrentIndex(currentIndex - 1);
        }
    };

    const handleSkip = () => {
        scrollRef.current.scrollTo({
            x: (slides.length - 1) * width,
            animated: true,
        });
        setCurrentIndex(slides.length - 1);
    };



    return (
        <View style={{ flex: 1 }}>
            <LinearGradient
                colors={['#134e4a', '#0a0a0a']}
                style={StyleSheet.absoluteFill}
            />

            <SafeAreaView style={{ flex: 1 }}>
                {/* TOP: Skip Button */}
                <View style={{ alignItems: 'flex-end', padding: 20 }}>
                    {currentIndex < slides.length - 1 && (
                        <TouchableOpacity onPress={handleSkip}>
                            <Text style={{ color: '#99f6e4', fontWeight: 'bold' }}>SKIP</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* MIDDLE: THE SCROLLVIEW (Eager Loading) */}
                <View style={{ flex: 3 }}>
                    <ScrollView
                        ref={scrollRef}
                        horizontal
                        pagingEnabled // Snaps to page
                        showsHorizontalScrollIndicator={false}
                        scrollEventThrottle={16} // smooths out animation
                        // This detects the swipe
                        onMomentumScrollEnd={handleScrollEnd}
                        // This drives the dots animation
                        onScroll={Animated.event(
                            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                            { useNativeDriver: false }
                        )}>
                        {/* WE RENDER ALL SLIDES IMMEDIATELY HERE */}
                        {slides.map((item) => (
                            <View
                                key={item.id}
                                style={{
                                    width: width,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: 20,
                                }}>
                                {/* Image Section */}
                                <View
                                    style={{
                                        height: width * 0.8,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        marginBottom: 30,
                                    }}>
                                    <Image
                                        source={item.image}
                                        style={{
                                            width: width * 0.8,
                                            height: '100%',
                                            resizeMode: 'contain',
                                        }}
                                    />
                                </View>

                                {/* Text Section */}
                                <View style={{ alignItems: 'center' }}>
                                    <Text
                                        style={{
                                            fontSize: 28,
                                            fontWeight: 'bold',
                                            color: 'white',
                                            textAlign: 'center',
                                            marginBottom: 10,
                                        }}>
                                        {item.title}
                                    </Text>
                                    <Text
                                        style={{
                                            fontSize: 16,
                                            color: '#9ca3af',
                                            textAlign: 'center',
                                            paddingHorizontal: 10,
                                        }}>
                                        {item.desc}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                </View>

                {/* BOTTOM: Indicators & Buttons */}
                <View
                    style={{ flex: 1, paddingHorizontal: 24, justifyContent: 'center' }}>
                    {/* Animated Dots */}
                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'center',
                            gap: 8,
                            marginBottom: 30,
                        }}>
                        {slides.map((_, i) => {
                            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
                            const dotWidth = scrollX.interpolate({
                                inputRange,
                                outputRange: [10, 25, 10],
                                extrapolate: 'clamp',
                            });
                            const dotColor = scrollX.interpolate({
                                inputRange,
                                outputRange: ['#374151', '#22c55e', '#374151'],
                                extrapolate: 'clamp',
                            });
                            return (
                                <Animated.View
                                    key={i}
                                    style={{
                                        height: 8,
                                        borderRadius: 4,
                                        width: dotWidth,
                                        backgroundColor: dotColor,
                                    }}
                                />
                            );
                        })}
                    </View>

                    {/* Controls */}
                    {currentIndex === slides.length - 1 ? (
                        <View style={{ gap: 15 }}>
                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={() => onRegister({})}>
                                <UserPlus size={20} color="white" style={{ marginRight: 10 }} />
                                <Text style={styles.primaryButtonText}>CREATE ACCOUNT</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={{ alignItems: 'center', marginTop: 15 }}
                                onPress={onLogin}>
                                {/* ^^^ THIS LINE IS KEY: It tells the button to run the login action */}
                                <Text style={{ color: '#9ca3af' }}>
                                    Already have an account?{' '}
                                    <Text style={{ color: '#99f6e4', fontWeight: 'bold' }}>
                                        Login
                                    </Text>
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}>
                            {/* Back Arrow */}
                            {currentIndex > 0 ? (
                                <TouchableOpacity
                                    onPress={handleBack}
                                    style={{
                                        width: 50,
                                        height: 50,
                                        borderRadius: 25,
                                        backgroundColor: 'rgba(255,255,255,0.1)',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                    <ArrowLeft size={24} color="white" />
                                </TouchableOpacity>
                            ) : (
                                <View style={{ width: 50 }} />
                            )}

                            {/* Next Arrow */}
                            <TouchableOpacity
                                onPress={handleNext}
                                style={{
                                    width: 50,
                                    height: 50,
                                    borderRadius: 25,
                                    backgroundColor: '#22c55e',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                <ArrowLeft
                                    size={24}
                                    color="white"
                                    style={{ transform: [{ rotate: '180deg' }] }}
                                />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </SafeAreaView>
        </View>
    );
};

export default OnboardingScreen;

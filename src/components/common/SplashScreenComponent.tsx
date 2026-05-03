import React, { useEffect, useRef } from 'react';
import { View, Image, Animated, StyleSheet, Text } from 'react-native';
interface Props {
    onAnimationComplete: () => void;
}
export const SplashScreenComponent = ({ onAnimationComplete }: Props) => {
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const logoScale = useRef(new Animated.Value(0.95)).current;
    const opacityText = useRef(new Animated.Value(0)).current;
    const translateText = useRef(new Animated.Value(15)).current;
    const barWidth = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.sequence([
            Animated.parallel([
                Animated.timing(logoOpacity, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(logoScale, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ]),
            Animated.parallel([
                Animated.timing(opacityText, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(translateText, {
                    toValue: 0,
                    duration: 500,
                    useNativeDriver: true,
                }),
            ]),
            Animated.timing(barWidth, {
                toValue: 160,
                duration: 1500,
                useNativeDriver: false,
            }),
            Animated.delay(300),
        ]).start(() => {
            onAnimationComplete();
        });
    }, []);
    return (
        <View style={styles.container}>
            <Animated.Image
                source={require('../../../assets/splash-logo.png')}
                style={[
                    styles.logo,
                    {
                        opacity: logoOpacity,
                        transform: [{ scale: logoScale }]
                    }
                ]}
                resizeMode="contain"
            />
            <View style={styles.centerContent}>
                <Animated.View style={[
                    styles.textWrap,
                    {
                        opacity: opacityText,
                        transform: [{ translateY: translateText }]
                    }
                ]}>
                    <Text style={styles.brandName}>APEX</Text>
                    <Text style={styles.brandSub}>BUILD SMART</Text>
                </Animated.View>
                <Animated.View style={[styles.barWrap, { opacity: opacityText }]}>
                    <View style={styles.barTrack}>
                        <Animated.View style={[styles.barFill, { width: barWidth }]} />
                    </View>
                </Animated.View>
            </View>
        </View>
    );
};
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        width: 140,
        height: 140,
        borderRadius: 32,
    },
    centerContent: {
        position: 'absolute',
        bottom: 100, 
        alignItems: 'center',
    },
    textWrap: {
        alignItems: 'center',
        gap: 5,
    },
    brandName: {
        fontSize: 26,
        fontWeight: '800',
        color: '#1d4ed8',
        letterSpacing: 3,
    },
    brandSub: {
        fontSize: 10,
        color: '#94a3b8',
        letterSpacing: 3,
        fontWeight: '500',
    },
    barWrap: {
        marginTop: 52,
    },
    barTrack: {
        width: 160,
        height: 3,
        backgroundColor: '#e2e8f0',
        borderRadius: 99,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        backgroundColor: '#1d4ed8',
        borderRadius: 99,
    },
});


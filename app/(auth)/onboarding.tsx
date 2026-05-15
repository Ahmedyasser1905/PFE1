import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Dimensions,
    TouchableOpacity,
    StatusBar,
    Animated,
    ViewStyle,
    TextStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '~/constants/theme';
import { OnboardingCard } from '~/components/features/auth/OnboardingCard';
import { Building2, HardHat, ShieldCheck, ChevronRight, ChevronLeft, PieChart } from 'lucide-react-native';
import { storage } from '~/utils/storage';
import { useLanguage } from '~/context/LanguageContext';

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.primary,
    } as ViewStyle,
    skipButton: {
        position: 'absolute',
        top: 60,
        zIndex: 10,
    } as ViewStyle,
    skipButtonLtr: {
        right: 30,
    } as ViewStyle,
    skipButtonRtl: {
        left: 30,
    } as ViewStyle,
    skipText: {
        fontSize: 16,
        fontWeight: '700',
        color: 'white',
        opacity: 0.8,
    } as TextStyle,
    iconContainer: {
        width: 240,
        height: 240,
        borderRadius: 120,
        justifyContent: 'center',
        alignItems: 'center',
    } as ViewStyle,
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.xl,
        paddingBottom: theme.spacing.xl,
        height: 100,
    } as ViewStyle,
    footerRtl: {
        flexDirection: 'row-reverse',
    } as ViewStyle,
    pagination: {
        flexDirection: 'row',
        height: 64,
        alignItems: 'center',
    } as ViewStyle,
    paginationRtl: {
        flexDirection: 'row-reverse',
    } as ViewStyle,
    dot: {
        height: 10,
        borderRadius: 5,
        backgroundColor: 'white',
        marginHorizontal: 4,
    } as ViewStyle,
    nextButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 5,
    } as ViewStyle,
});

const SLIDES = [
    {
        id: '1',
        titleKey: 'onboarding.slide1_title',
        subtitleKey: 'onboarding.slide1_subtitle',
        icon: Building2,
    },
    {
        id: '2',
        titleKey: 'onboarding.slide2_title',
        subtitleKey: 'onboarding.slide2_subtitle',
        icon: HardHat,
    },
    {
        id: '3',
        titleKey: 'onboarding.slide3_title',
        subtitleKey: 'onboarding.slide3_subtitle',
        icon: ShieldCheck,
    },
    {
        id: '4',
        titleKey: 'onboarding.slide4_title',
        subtitleKey: 'onboarding.slide4_subtitle',
        icon: PieChart,
    },
];

export default function OnboardingScreen() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollX = useRef(new Animated.Value(0)).current;
    const slidesRef = useRef<FlatList>(null);
    const router = useRouter();
    const { t, isRTL } = useLanguage();

    const viewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems && viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;
    
    const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;
    
    const handleSkip = async () => {
        try {
            await storage.setItem('hasCompletedOnboarding_v6', 'true');
            router.replace('/login');
        } catch (err) {
            console.log('Error @handleSkip', err);
        }
    };
    
    const scrollTo = async () => {
        if (currentIndex < SLIDES.length - 1) {
            slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
        } else {
            try {
                await storage.setItem('hasCompletedOnboarding_v6', 'true');
                router.replace('/login');
            } catch (err) {
                console.log('Error @scrollTo', err);
            }
        }
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={{ flex: 1 }}>
                <StatusBar barStyle="light-content" />
                <TouchableOpacity 
                    style={[styles.skipButton, isRTL ? styles.skipButtonRtl : styles.skipButtonLtr]}
                    onPress={handleSkip}
                >
                    <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
                </TouchableOpacity>
                <FlatList
                    data={SLIDES}
                    renderItem={({ item }) => (
                        <OnboardingCard
                            title={t(item.titleKey)}
                            subtitle={t(item.subtitleKey)}
                            illustration={
                                <View style={styles.iconContainer}>
                                    <item.icon size={180} color="white" strokeWidth={1} />
                                </View>
                            }
                            textColor="white"
                        />
                    )}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    pagingEnabled
                    bounces={false}
                    keyExtractor={(item) => item.id}
                    onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
                        useNativeDriver: false,
                    })}
                    onViewableItemsChanged={viewableItemsChanged}
                    viewabilityConfig={viewConfig}
                    scrollEventThrottle={32}
                    ref={slidesRef}
                    style={{ flex: 1 }}
                    initialNumToRender={4}
                    maxToRenderPerBatch={4}
                    windowSize={5}
                    removeClippedSubviews={false}
                    inverted={isRTL}
                />
                <View style={[styles.footer, isRTL && styles.footerRtl]}>
                    <View style={[styles.pagination, isRTL && styles.paginationRtl]}>
                        {SLIDES.map((_, i) => {
                            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
                            const dotWidth = scrollX.interpolate({
                                inputRange,
                                outputRange: [10, 20, 10],
                                extrapolate: 'clamp',
                            });
                            const opacity = scrollX.interpolate({
                                inputRange,
                                outputRange: [0.3, 1, 0.3],
                                extrapolate: 'clamp',
                            });
                            return (
                                <Animated.View
                                    style={[styles.dot, { width: dotWidth, opacity }]}
                                    key={i.toString()}
                                />
                            );
                        })}
                    </View>
                    <TouchableOpacity style={styles.nextButton} onPress={scrollTo}>
                        {isRTL ? (
                            <ChevronLeft color={theme.colors.primary} size={32} />
                        ) : (
                            <ChevronRight color={theme.colors.primary} size={32} />
                        )}
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
}


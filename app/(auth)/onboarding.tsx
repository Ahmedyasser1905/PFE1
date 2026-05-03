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
import { Building2, HardHat, ShieldCheck, ChevronRight, PieChart } from 'lucide-react-native';
import { storage } from '~/utils/storage';

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.primary,
    } as ViewStyle,
    skipButton: {
        position: 'absolute',
        top: 60,
        right: 30,
        zIndex: 10,
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
    pagination: {
        flexDirection: 'row',
        height: 64,
        alignItems: 'center',
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
        title: 'Accurate Estimates',
        subtitle: 'Calculate construction costs in real time with professional precision.',
        icon: Building2,
    },
    {
        id: '2',
        title: 'Project Management',
        subtitle: 'Track your project progress and manage resources efficiently.',
        icon: HardHat,
    },
    {
        id: '3',
        title: 'Secure Documents',
        subtitle: 'Store your estimates and invoices securely in the Apex cloud.',
        icon: ShieldCheck,
    },
    {
        id: '4',
        title: 'Detailed Analytics',
        subtitle: 'Get comprehensive reports on spending and optimize your budgets.',
        icon: PieChart,
    },
];
export default function OnboardingScreen() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollX = useRef(new Animated.Value(0)).current;
    const slidesRef = useRef<FlatList>(null);
    const router = useRouter();
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
                    style={styles.skipButton}
                    onPress={handleSkip}
                >
                    <Text style={styles.skipText}>Skip</Text>
                </TouchableOpacity>
                <FlatList
                    data={SLIDES}
                    renderItem={({ item }) => (
                        <OnboardingCard
                            title={item.title}
                            subtitle={item.subtitle}
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
                />
                <View style={styles.footer}>
                    <View style={styles.pagination}>
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
                        <ChevronRight color={theme.colors.primary} size={32} />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
}


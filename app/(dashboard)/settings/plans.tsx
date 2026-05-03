import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Platform,
    StatusBar,
    ActivityIndicator,
    RefreshControl,
    ViewStyle,
    TextStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Check, Zap, Compass, Crown, AlertCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { theme } from '~/constants/theme';
import { plansApi, subscriptionApi } from '~/api/api';
import { useSubscriptionContext } from '~/context/SubscriptionContext';
import { useFeedback } from '~/context/FeedbackContext';
import type { Plan, PlanFeature } from '~/api/types';

// ─── Feature display helpers ──────────────────────────────────────────────────

/** Human-readable label for a feature key */
const FEATURE_LABELS: Record<string, string> = {
    projects_limit: 'Project Creation',
    ai_usage_limit: 'AI Requests',
    leaf_calculations_limit: 'Estimations',
    estimation_limit: 'Estimations',
    calculations_limit: 'Calculations',
};

/** Get a display string for a feature value */
function formatFeatureValue(key: string, value: string | number | boolean): string {
    if (value === 'unlimited' || value === -1 || value === '-1') return 'Unlimited';
    if (typeof value === 'boolean') return value ? '✓' : '—';
    const num = parseInt(String(value), 10);
    if (!isNaN(num)) {
        if (key === 'projects_limit') return `Up to ${num} projects`;
        if (key === 'ai_usage_limit') return `${num} requests`;
        if (key.includes('calculation') || key.includes('estimation')) return `${num} estimations`;
        return String(num);
    }
    return String(value);
}

/** Short display for comparison table */
function formatFeatureShort(value: string | number | boolean): string {
    if (value === 'unlimited' || value === -1 || value === '-1') return 'Unlimited';
    if (typeof value === 'boolean') return value ? '✓' : '—';
    return String(value);
}

/** Format price for display */
function formatPrice(price: number): string {
    if (price === 0) return 'Free';
    return price.toLocaleString('en-US');
}

/** Get period text based on duration */
function formatPeriod(duration: number): string {
    if (duration <= 0) return '';
    if (duration === 1) return '/day';
    if (duration === 7) return '/week';
    if (duration >= 28 && duration <= 31) return '/month';
    if (duration === 365 || duration === 366) return '/year';
    return `/${duration}d`;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PlansScreen() {
    const router = useRouter();
    const { subscription, isSubscriptionActive, refresh: refreshSubscription } = useSubscriptionContext();
    const { showFeedback } = useFeedback();

    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [subscribingPlanId, setSubscribingPlanId] = useState<string | null>(null);

    const fetchPlans = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);
            setError(null);
            const data = await plansApi.getAll();
            // Sort: free plans first, then by price ascending
            const sorted = [...data].sort((a, b) => {
                if (a.price === 0 && b.price !== 0) return -1;
                if (a.price !== 0 && b.price === 0) return 1;
                return a.price - b.price;
            });
            setPlans(sorted);
        } catch (err: any) {
            setError(err?.message || 'Failed to load plans');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchPlans();
    }, [fetchPlans]);

    // ─── Handle plan selection / switch ────────────────────────────────────────
    const handleSelectPlan = useCallback(async (plan: Plan) => {
        try {
            setSubscribingPlanId(plan.planId);

            if (isSubscriptionActive && subscription?.planId) {
                // Already subscribed — switch plan
                await subscriptionApi.switchPlan(plan.planId);
                showFeedback({
                    title: 'Plan Switched!',
                    message: `You've switched to the ${plan.nameEn} plan.`,
                    type: 'success',
                });
            } else {
                // No subscription — create new
                await subscriptionApi.create(plan.planId);
                showFeedback({
                    title: 'Plan Activated!',
                    message: `Welcome to the ${plan.nameEn} plan.`,
                    type: 'success',
                });
            }

            await refreshSubscription();
            router.back();
        } catch (err: any) {
            showFeedback({
                title: 'Error',
                message: err?.message || 'Failed to change plan. Please try again.',
                type: 'error',
            });
        } finally {
            setSubscribingPlanId(null);
        }
    }, [isSubscriptionActive, subscription, refreshSubscription, router, showFeedback]);

    // ─── Build comparison data dynamically ────────────────────────────────────
    const comparisonData = useMemo(() => {
        if (plans.length === 0) return [];

        // Collect all unique feature keys across all plans
        const allKeys = new Set<string>();
        plans.forEach(plan => {
            plan.features?.forEach(f => allKeys.add(f.featureKey));
        });

        // Add common features that are implied for all plans
        const impliedFeatures = ['Main Modules Access', 'PDF Export'];

        const rows: Array<{
            name: string;
            values: Record<string, { value: string | boolean; isSpecial: boolean }>;
        }> = [];

        // Feature-key based rows
        allKeys.forEach(key => {
            const label = FEATURE_LABELS[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            const row: typeof rows[0] = { name: label, values: {} };

            plans.forEach(plan => {
                const feature = plan.features?.find(f => f.featureKey === key);
                if (feature) {
                    const formatted = formatFeatureShort(feature.featureValue);
                    row.values[plan.planId] = {
                        value: formatted,
                        isSpecial: key === 'ai_usage_limit' && (feature.featureValue === 'unlimited' || feature.featureValue === '-1'),
                    };
                } else {
                    row.values[plan.planId] = { value: false, isSpecial: false };
                }
            });

            rows.push(row);
        });

        // Add implied features as boolean rows
        impliedFeatures.forEach(name => {
            const row: typeof rows[0] = { name, values: {} };
            plans.forEach(plan => {
                row.values[plan.planId] = { value: true, isSpecial: false };
            });
            rows.push(row);
        });

        return rows;
    }, [plans]);

    // ─── Determine current plan ───────────────────────────────────────────────
    const currentPlanId = subscription?.planId || null;

    // ─── Loading state ────────────────────────────────────────────────────────
    if (loading && !refreshing) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <ArrowLeft size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Subscription Plans</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={styles.loadingText}>Loading plans...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // ─── Error state ──────────────────────────────────────────────────────────
    if (error && plans.length === 0) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <ArrowLeft size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Subscription Plans</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.loadingContainer}>
                    <AlertCircle size={48} color={theme.colors.error} />
                    <Text style={[styles.loadingText, { color: theme.colors.error, marginBottom: 16 }]}>{error}</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={() => fetchPlans()}>
                        <Text style={styles.retryBtnText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Subscription Plans</Text>
                <View style={{ width: 40 }} />
            </View>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => fetchPlans(true)}
                        tintColor={theme.colors.primary}
                        colors={[theme.colors.primary]}
                    />
                }
            >
                <View style={styles.intro}>
                    <Text style={styles.title}>Choose Your Plan{'\n'}to Start Building</Text>
                    <Text style={styles.subtitle}>
                        Select the plan that best fits your construction and estimation needs.
                    </Text>
                </View>

                {/* ─── Plan Cards ─── */}
                {plans.map((plan) => {
                    const isFree = plan.price === 0;
                    const isCurrentPlan = currentPlanId === plan.planId;
                    const isRecommended = !isFree && plans.length > 1;
                    const isSubscribing = subscribingPlanId === plan.planId;

                    return (
                        <View key={plan.planId} style={[styles.planCard, isRecommended && styles.recommendedCard]}>
                            <View style={styles.planHeaderRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.planLabel}>{plan.nameEn}</Text>
                                    <Text style={styles.planDesc}>
                                        {plan.descriptionEn || (isFree
                                            ? 'Perfect for getting started.'
                                            : `For growing teams and enterprises.`)}
                                    </Text>
                                </View>
                                {isCurrentPlan ? (
                                    <View style={styles.currentBadge}>
                                        <Text style={styles.currentBadgeText}>CURRENT</Text>
                                    </View>
                                ) : isRecommended ? (
                                    <View style={styles.recommendedBadge}>
                                        <View style={styles.recommendedBadgeInner}>
                                            <Text style={styles.recommendedText}>RECOMMENDED</Text>
                                        </View>
                                    </View>
                                ) : null}
                            </View>

                            {/* Price */}
                            <View style={styles.priceSection}>
                                <Text style={styles.price}>{formatPrice(plan.price)}</Text>
                                {!isFree && (
                                    <>
                                        <Text style={styles.priceCurrency}> DZD</Text>
                                        <Text style={styles.period}>{formatPeriod(plan.duration)}</Text>
                                    </>
                                )}
                            </View>

                            {/* Select Button */}
                            <TouchableOpacity
                                style={[
                                    styles.planBtn,
                                    isFree ? styles.freeBtn : styles.companyBtn,
                                    isCurrentPlan && styles.currentPlanBtn,
                                ]}
                                activeOpacity={0.8}
                                onPress={() => handleSelectPlan(plan)}
                                disabled={isCurrentPlan || isSubscribing}
                            >
                                {isSubscribing ? (
                                    <ActivityIndicator size="small" color={isFree ? theme.colors.primary : 'white'} />
                                ) : (
                                    <Text style={[
                                        styles.planBtnText,
                                        isFree ? styles.freeBtnText : styles.companyBtnText,
                                        isCurrentPlan && styles.currentPlanBtnText,
                                    ]}>
                                        {isCurrentPlan ? 'Current Plan' : `Select ${plan.nameEn}`}
                                    </Text>
                                )}
                            </TouchableOpacity>

                            {/* Features List */}
                            <View style={styles.featuresList}>
                                {plan.features?.map((feature, idx) => (
                                    <View key={idx} style={styles.featureItem}>
                                        {feature.featureKey === 'ai_usage_limit' && !isFree ? (
                                            <Zap size={18} color="#f59e0b" fill="#f59e0b" />
                                        ) : (
                                            <View style={styles.iconCircle}>
                                                <Check size={12} color={theme.colors.primary} strokeWidth={3} />
                                            </View>
                                        )}
                                        <Text style={styles.featureText}>
                                            {formatFeatureValue(feature.featureKey, feature.featureValue)}
                                        </Text>
                                    </View>
                                ))}
                                {/* Implied features */}
                                <View style={styles.featureItem}>
                                    <View style={styles.iconCircle}>
                                        <Check size={12} color={theme.colors.primary} strokeWidth={3} />
                                    </View>
                                    <Text style={styles.featureText}>Main modules access</Text>
                                </View>
                                <View style={styles.featureItem}>
                                    <View style={styles.iconCircle}>
                                        <Check size={12} color={theme.colors.primary} strokeWidth={3} />
                                    </View>
                                    <Text style={styles.featureText}>PDF export</Text>
                                </View>
                            </View>
                        </View>
                    );
                })}

                {/* ─── Comparison Table ─── */}
                {comparisonData.length > 0 && plans.length > 1 && (
                    <View style={styles.comparisonSection}>
                        <Text style={styles.comparisonTitle}>Compare Plan Features</Text>
                        <View style={styles.table}>
                            {/* Header */}
                            <View style={styles.tableHeader}>
                                <Text style={[styles.columnHeader, { flex: 1.5, textAlign: 'left' }]}>Features</Text>
                                {plans.map(plan => (
                                    <Text
                                        key={plan.planId}
                                        style={[
                                            styles.columnHeader,
                                            plan.price > 0 && { color: theme.colors.primary },
                                        ]}
                                    >
                                        {plan.nameEn}
                                    </Text>
                                ))}
                            </View>

                            {/* Rows */}
                            {comparisonData.map((row, index) => (
                                <View key={index} style={[styles.tableRow, index % 2 === 1 && styles.alternateRow]}>
                                    <Text style={[styles.featureName, { flex: 1.5 }]}>{row.name}</Text>
                                    {plans.map(plan => {
                                        const cell = row.values[plan.planId];
                                        if (!cell) {
                                            return (
                                                <View key={plan.planId} style={styles.cell}>
                                                    <View style={styles.dash} />
                                                </View>
                                            );
                                        }
                                        const isCompany = plan.price > 0;
                                        return (
                                            <View key={plan.planId} style={isCompany ? styles.compCell : styles.cell}>
                                                {typeof cell.value === 'string' ? (
                                                    <View style={styles.companyStringCell}>
                                                        {cell.isSpecial && (
                                                            <Zap size={14} color="#f59e0b" fill="#f59e0b" style={{ marginRight: 4 }} />
                                                        )}
                                                        <Text style={[
                                                            styles.cellText,
                                                            cell.isSpecial && { fontWeight: '700', color: '#f59e0b' },
                                                        ]}>
                                                            {cell.value}
                                                        </Text>
                                                    </View>
                                                ) : cell.value === true ? (
                                                    <Check size={18} color={theme.colors.primary} />
                                                ) : (
                                                    <View style={styles.dash} />
                                                )}
                                            </View>
                                        );
                                    })}
                                </View>
                            ))}
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    } as ViewStyle,
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 10 : 0,
        paddingBottom: 15,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    } as ViewStyle,
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
    } as ViewStyle,
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text,
    } as TextStyle,
    scrollContent: {
        padding: theme.spacing.lg,
        paddingBottom: 80,
    } as ViewStyle,

    // Loading / Error
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    } as ViewStyle,
    loadingText: {
        fontSize: 15,
        color: theme.colors.textSecondary,
        fontWeight: '500',
        marginTop: 12,
    } as TextStyle,
    retryBtn: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    } as ViewStyle,
    retryBtnText: {
        color: 'white',
        fontSize: 15,
        fontWeight: '700',
    } as TextStyle,

    // Intro
    intro: {
        alignItems: 'center',
        marginBottom: 40,
        marginTop: 20,
    } as ViewStyle,
    title: {
        fontSize: 34,
        fontWeight: '900',
        color: '#0f172a',
        textAlign: 'center',
        lineHeight: 42,
        letterSpacing: -0.5,
    } as TextStyle,
    subtitle: {
        fontSize: 16,
        color: '#64748b',
        textAlign: 'center',
        marginTop: 14,
        paddingHorizontal: 25,
        lineHeight: 24,
    } as TextStyle,

    // Plan cards
    planCard: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 24,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 3,
    } as ViewStyle,
    recommendedCard: {
        borderColor: theme.colors.primary,
        borderWidth: 2,
    } as ViewStyle,
    planHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    } as ViewStyle,
    recommendedBadge: {
        backgroundColor: '#ffedd5',
        borderRadius: 8,
        padding: 1,
    } as ViewStyle,
    recommendedBadgeInner: {
        paddingHorizontal: 10,
        paddingVertical: 4,
    } as ViewStyle,
    recommendedText: {
        color: '#f97316',
        fontSize: 10,
        fontWeight: '900',
    } as TextStyle,
    currentBadge: {
        backgroundColor: '#dcfce7',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 5,
    } as ViewStyle,
    currentBadgeText: {
        color: '#16a34a',
        fontSize: 10,
        fontWeight: '900',
    } as TextStyle,
    planLabel: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1e40af',
        marginBottom: 6,
    } as TextStyle,
    planDesc: {
        fontSize: 14,
        color: '#64748b',
        lineHeight: 20,
        maxWidth: '85%',
    } as TextStyle,
    priceSection: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 28,
    } as ViewStyle,
    price: {
        fontSize: 54,
        fontWeight: '900',
        color: '#0f172a',
        letterSpacing: -1,
    } as TextStyle,
    priceCurrency: {
        fontSize: 20,
        fontWeight: '700',
        color: '#64748b',
        marginBottom: 6,
    } as TextStyle,
    period: {
        fontSize: 18,
        color: '#64748b',
        marginLeft: 2,
        fontWeight: '500',
    } as TextStyle,

    // Buttons
    planBtn: {
        height: 52,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    } as ViewStyle,
    freeBtn: {
        backgroundColor: '#eff6ff',
    } as ViewStyle,
    companyBtn: {
        backgroundColor: theme.colors.primary,
    } as ViewStyle,
    currentPlanBtn: {
        backgroundColor: '#f1f5f9',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    } as ViewStyle,
    planBtnText: {
        fontSize: 16,
        fontWeight: '700',
    } as TextStyle,
    freeBtnText: {
        color: theme.colors.primary,
    } as TextStyle,
    companyBtnText: {
        color: 'white',
    } as TextStyle,
    currentPlanBtnText: {
        color: '#94a3b8',
    } as TextStyle,

    // Feature list
    featuresList: {
        gap: 16,
    } as ViewStyle,
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    } as ViewStyle,
    iconCircle: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 1.5,
        borderColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    } as ViewStyle,
    featureText: {
        fontSize: 15,
        color: '#334155',
        fontWeight: '500',
    } as TextStyle,

    // Comparison table
    comparisonSection: {
        marginTop: 40,
    } as ViewStyle,
    comparisonTitle: {
        fontSize: 26,
        fontWeight: '900',
        color: '#0f172a',
        textAlign: 'center',
        marginBottom: 28,
    } as TextStyle,
    table: {
        backgroundColor: 'white',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 1,
    } as ViewStyle,
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f8fafc',
        padding: 18,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    } as ViewStyle,
    columnHeader: {
        flex: 1,
        fontSize: 14,
        fontWeight: '800',
        color: '#475569',
        textAlign: 'center',
    } as TextStyle,
    tableRow: {
        flexDirection: 'row',
        padding: 20,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    } as ViewStyle,
    alternateRow: {
        backgroundColor: '#fbfcfe',
    } as ViewStyle,
    featureName: {
        flex: 1,
        fontSize: 14,
        fontWeight: '700',
        color: '#334155',
    } as TextStyle,
    cell: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    } as ViewStyle,
    compCell: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#eff6ff50',
    } as ViewStyle,
    cellText: {
        fontSize: 13,
        color: '#64748b',
        textAlign: 'center',
    } as TextStyle,
    companyStringCell: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    } as ViewStyle,
    dash: {
        width: 12,
        height: 2,
        backgroundColor: '#cbd5e1',
        borderRadius: 1,
    } as ViewStyle,
});

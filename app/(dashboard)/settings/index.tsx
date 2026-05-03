import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Platform,
    StatusBar,
    RefreshControl,
    Pressable,
    I18nManager,
    ViewStyle,
    TextStyle
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    User,
    Lock,
    ChevronRight,
    LogOut,
    Bell,
    Globe,
    CircleHelp,
    FileText,
    ArrowLeft,
    Shield,
    Gavel,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { theme } from '~/constants/theme';
import { useAuth } from '~/context/AuthContext';
import { useUser } from '~/hooks/useUser';
import { useLanguage } from '~/context/LanguageContext';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    } as ViewStyle,
    rtlContainer: {
        // RTL specific styles if needed
    } as ViewStyle,
    profile: {
        alignItems: 'center',
        paddingVertical: theme.spacing.xxl,
        backgroundColor: theme.colors.background,
    } as ViewStyle,
    rtlProfile: {
        // RTL specific profile styles
    } as ViewStyle,
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
        ...theme.shadows.md,
    } as ViewStyle,
    avatarText: {
        color: theme.colors.white,
        fontSize: 36,
        fontWeight: '800',
    } as TextStyle,
    name: {
        ...theme.typography.h3,
        color: theme.colors.text,
    } as TextStyle,
    email: {
        ...theme.typography.small,
        color: theme.colors.textSecondary,
        marginTop: 2,
    } as TextStyle,

    menu: {
        marginTop: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
    } as ViewStyle,
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: theme.spacing.lg,
        paddingHorizontal: theme.spacing.md,
        backgroundColor: theme.colors.white,
        borderRadius: theme.roundness.lg,
        marginBottom: theme.spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.divider,
        ...theme.shadows.xs,
    } as ViewStyle,
    rtlMenuItem: {
        flexDirection: 'row-reverse',
    } as ViewStyle,
    menuLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
    } as ViewStyle,
    rtlMenuLeft: {
        flexDirection: 'row-reverse',
    } as ViewStyle,
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: theme.roundness.md,
        backgroundColor: theme.colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
    } as ViewStyle,
    menuText: {
        ...theme.typography.bodyMedium,
        color: theme.colors.text,
    } as TextStyle,
    rtlText: {
        textAlign: 'right',
    } as TextStyle,
    menuRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
    } as ViewStyle,
    rtlMenuRight: {
        flexDirection: 'row-reverse',
    } as ViewStyle,
    value: {
        ...theme.typography.small,
        color: theme.colors.textSecondary,
        fontWeight: '600',
    } as TextStyle,

    logout: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: theme.spacing.sm,
        margin: theme.spacing.xl,
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.errorLight,
        borderRadius: theme.roundness.xl,
        borderWidth: 1,
        borderColor: theme.colors.errorLight,
    } as ViewStyle,
    rtlLogout: {
        flexDirection: 'row-reverse',
    } as ViewStyle,
    logoutText: {
        color: theme.colors.error,
        ...theme.typography.bodyBold,
    } as TextStyle,

    footer: {
        alignItems: 'center',
        paddingBottom: theme.spacing.xxxl,
        marginTop: theme.spacing.xl,
    } as ViewStyle,
    version: {
        ...theme.typography.caption,
        color: theme.colors.textMuted,
        fontWeight: '700',
    } as TextStyle,

    // Modal Styles
    modalOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
        zIndex: 1000,
    } as ViewStyle,
    modalContent: {
        backgroundColor: theme.colors.white,
        borderTopLeftRadius: theme.roundness.xxl,
        borderTopRightRadius: theme.roundness.xxl,
        padding: theme.spacing.xl,
        paddingBottom: Platform.OS === 'ios' ? 48 : 32,
    } as ViewStyle,
    modalHeader: {
        marginBottom: theme.spacing.xl,
        alignItems: 'center',
    } as ViewStyle,
    modalTitle: {
        ...theme.typography.h3,
        color: theme.colors.text,
    } as TextStyle,
    langOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.lg,
        borderRadius: theme.roundness.lg,
        backgroundColor: theme.colors.surface,
        marginBottom: theme.spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.border,
    } as ViewStyle,
    langOptionActive: {
        backgroundColor: theme.colors.primaryLight,
        borderColor: theme.colors.primary,
    } as ViewStyle,
    langText: {
        ...theme.typography.bodyMedium,
        color: theme.colors.textSecondary,
    } as TextStyle,
    langTextActive: {
        color: theme.colors.primary,
        fontWeight: '700',
    } as TextStyle,
    checkDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: theme.colors.primary,
    } as ViewStyle,
    closeModalBtn: {
        marginTop: theme.spacing.md,
        padding: theme.spacing.md,
        alignItems: 'center',
    } as ViewStyle,
    closeModalText: {
        ...theme.typography.bodyBold,
        color: theme.colors.textSecondary,
    } as TextStyle,
    iconRTL: { transform: [{ scaleX: -1 }] } as ViewStyle,
});

export default function ProfileSettings() {
    const router = useRouter();
    const { logout } = useAuth();
    const { name, email, fetchProfile } = useUser();
    const { t, language, setLanguage, isRTL } = useLanguage();

    const [refreshing, setRefreshing] = useState(false);
    const [showLanguageModal, setShowLanguageModal] = useState(false);

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            await fetchProfile();
        } catch (error) {
            console.error(error);
        }
        setRefreshing(false);
    };

    const handleLogout = async () => {
        try {
            await logout();
            router.replace('/login?mode=form');
        } catch (error) {
            console.error(error);
        }
    };

    const handleLanguageChange = async (lang: 'en' | 'ar') => {
        try {
            await setLanguage(lang);
            setShowLanguageModal(false);
        } catch (error) {
            console.error(error);
        }
    };

    const menuItems = [
        { title: t('settings.personal_info'), icon: User, route: '/settings/personal-info' },
        { title: t('settings.notifications'), icon: Bell, route: null },
        {
            title: t('settings.language'),
            icon: Globe,
            value: language === 'en' ? 'English' : 'العربية',
            onPress: () => setShowLanguageModal(true)
        },
        { title: t('settings.subscription'), icon: FileText, route: '/settings/subscription' },
        { title: t('settings.terms'), icon: Gavel, route: '/settings/terms' },
        { title: t('settings.privacy'), icon: Shield, route: '/settings/privacy' },
        { title: t('settings.help'), icon: CircleHelp, route: '/settings/help' },
    ];

    const isArabic = language === 'ar';

    return (
        <SafeAreaView style={[styles.container, isArabic && styles.rtlContainer]} edges={['bottom']}>




            <ScrollView
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Profile */}
                <View style={[styles.profile, isArabic && styles.rtlProfile]}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {name.charAt(0).toUpperCase()}
                        </Text>
                    </View>

                    <Text style={styles.name}>{name}</Text>
                    <Text style={styles.email}>{email}</Text>
                </View>

                {/* Menu */}
                <View style={styles.menu}>
                    {menuItems.map((item, i) => (
                        <TouchableOpacity
                            key={i}
                            style={[styles.menuItem, isArabic && styles.rtlMenuItem]}
                            onPress={() => {
                                if (item.onPress) item.onPress();
                                else if (item.route) router.push(item.route);
                            }}
                        >
                            <View style={[styles.menuLeft, isArabic && styles.rtlMenuLeft]}>
                                <View style={styles.iconBox}>
                                    <item.icon size={18} color={theme.colors.primary} />
                                </View>
                                <Text style={[styles.menuText, isArabic && styles.rtlText]}>{item.title}</Text>
                            </View>

                            <View style={[styles.menuRight, isArabic && styles.rtlMenuRight]}>
                                {item.value && (
                                    <Text style={styles.value}>{item.value}</Text>
                                )}
                                <ChevronRight
                                    size={18}
                                    color={theme.colors.textMuted}
                                    style={isArabic ? styles.iconRTL : undefined}
                                />
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Logout */}
                <TouchableOpacity style={[styles.logout, isArabic && styles.rtlLogout]} onPress={handleLogout}>
                    <LogOut
                        size={18}
                        color={theme.colors.error}
                        style={isArabic ? styles.iconRTL : undefined}
                    />
                    <Text style={styles.logoutText}>{t('common.logout')}</Text>
                </TouchableOpacity>

                <View style={styles.footer}>
                    <Text style={styles.version}>© 2026 Apex</Text>
                </View>
            </ScrollView>

            {/* Language Modal */}
            {showLanguageModal && (
                <View style={styles.modalOverlay}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowLanguageModal(false)} />
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t('settings.choose_language')}</Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.langOption, language === 'en' && styles.langOptionActive]}
                            onPress={() => handleLanguageChange('en')}
                        >
                            <Text style={[styles.langText, language === 'en' && styles.langTextActive]}>English</Text>
                            {language === 'en' && <View style={styles.checkDot} />}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.langOption, language === 'ar' && styles.langOptionActive]}
                            onPress={() => handleLanguageChange('ar')}
                        >
                            <Text style={[styles.langText, language === 'ar' && styles.langTextActive]}>العربية (Arabic)</Text>
                            {language === 'ar' && <View style={styles.checkDot} />}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.closeModalBtn}
                            onPress={() => setShowLanguageModal(false)}
                        >
                            <Text style={styles.closeModalText}>{t('common.cancel')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
}

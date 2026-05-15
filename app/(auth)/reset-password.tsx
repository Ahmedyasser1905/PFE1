import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ViewStyle, TextStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lock, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { theme } from '~/constants/theme';
import { Logo } from '~/components/ui/Logo';
import { BaseInput } from '~/components/ui/BaseInput';
import { BaseButton } from '~/components/ui/BaseButton';
import { authApi } from '~/api/api';
import { useFeedback } from '~/context/FeedbackContext';
import { useLanguage } from '~/context/LanguageContext';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    } as ViewStyle,
    keyboardView: {
        flex: 1,
    } as ViewStyle,
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: theme.spacing.xl,
        paddingTop: theme.spacing.xl,
        paddingBottom: theme.spacing.xl,
    } as ViewStyle,
    backButton: {
        alignSelf: 'flex-start',
        marginBottom: theme.spacing.xl,
        paddingHorizontal: 0,
    } as ViewStyle,
    backButtonRtl: {
        alignSelf: 'flex-end',
    } as ViewStyle,
    header: {
        marginBottom: theme.spacing.xxl,
    } as ViewStyle,
    content: {
        flex: 1,
    } as ViewStyle,
    successContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.xl,
        textAlign: 'center',
    } as ViewStyle,
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
        marginTop: theme.spacing.lg,
        letterSpacing: -1,
        textAlign: 'center',
    } as TextStyle,
    subtitle: {
        fontSize: 16,
        color: theme.colors.textSecondary,
        lineHeight: 24,
        marginBottom: theme.spacing.xl,
        textAlign: 'center',
    } as TextStyle,
    submitButton: {
        marginTop: theme.spacing.lg,
        width: '100%',
    } as ViewStyle,
    rtlText: {
        textAlign: 'right',
    } as TextStyle,
    rtlTitle: {
        textAlign: 'right',
    } as TextStyle,
});

export default function ResetPasswordScreen() {
    const { email, token } = useLocalSearchParams<{ email: string; token: string }>();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const { showFeedback } = useFeedback();
    const { t, isRTL } = useLanguage();

    const handleResetPassword = async () => {
        if (!password || !confirmPassword) {
            showFeedback({ title: t('common.error'), message: t('auth.fill_all_fields'), type: 'warning' });
            return;
        }
        if (password !== confirmPassword) {
            showFeedback({ title: t('common.error'), message: t('auth.passwords_no_match'), type: 'warning' });
            return;
        }
        if (password.length < 6) {
            showFeedback({ title: t('common.error'), message: t('auth.password_min_length'), type: 'warning' });
            return;
        }
        try {
            setLoading(true);
            await authApi.resetPassword({
                token: token!,
                password
            });
            setSuccess(true);
        } catch (error: any) {
            console.error('Reset password failed:', error.response?.data?.message || error.message);
            showFeedback({
                title: t('common.error'),
                message: JSON.stringify(error?.response?.data || error?.message || t('auth.invalid_expired_token')),
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };
    if (success) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.successContent}>
                    <CheckCircle2 size={64} color={theme.colors.primary} />
                    <Text style={styles.title}>{t('auth.password_reset_title')}</Text>
                    <Text style={styles.subtitle}>
                        {t('auth.password_reset_success')}
                    </Text>
                    <BaseButton
                        title={t('auth.back_to_login_btn')}
                        onPress={() => router.replace('/')}
                        style={styles.submitButton}
                    />
                </View>
            </SafeAreaView>
        );
    }
    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <BaseButton
                        title={t('common.back')}
                        onPress={() => {
                            if (router.canGoBack()) router.back();
                            else router.replace('/(auth)/login');
                        }}
                        variant="ghost"
                        icon={isRTL ? ArrowRight : ArrowLeft}
                        iconPosition="left"
                        style={[styles.backButton, isRTL && styles.backButtonRtl]}
                    />
                    <View style={styles.header}>
                        <Logo size="md" />
                    </View>
                    <View style={styles.content}>
                        <Text style={[styles.title, isRTL && styles.rtlTitle]}>{t('auth.new_password_title')}</Text>
                        <Text style={[styles.subtitle, isRTL && styles.rtlText]}>
                            {t('auth.new_password_desc')}
                        </Text>
                        <BaseInput
                            label={t('auth.new_password_label')}
                            placeholder={t('auth.password_dots')}
                            icon={Lock}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                        <BaseInput
                            label={t('auth.confirm_new_password_label')}
                            placeholder={t('auth.password_dots')}
                            icon={Lock}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                        />
                        <BaseButton
                            title={t('auth.reset_password_btn')}
                            onPress={handleResetPassword}
                            loading={loading}
                            style={styles.submitButton}
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}


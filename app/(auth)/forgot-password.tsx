import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, ArrowLeft, ArrowRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
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
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    letterSpacing: -1,
  } as TextStyle,
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    lineHeight: 24,
    marginBottom: theme.spacing.xl,
  } as TextStyle,
  submitButton: {
    marginTop: theme.spacing.lg,
  } as ViewStyle,
  rtlText: {
    textAlign: 'right',
  } as TextStyle,
});

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { showFeedback } = useFeedback();
  const router = useRouter();
  const { t, isRTL } = useLanguage();

  const handleBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/(auth)/login');
  }, [router]);

  const handleResetRequest = useCallback(async () => {
    if (!email) {
      showFeedback({ title: t('common.error'), message: t('auth.enter_email'), type: 'warning' });
      return;
    }
    try {
      setLoading(true);
      await authApi.forgotPassword(email);
      showFeedback({
        title: t('auth.otp_sent'),
        message: t('auth.otp_sent_desc'),
        type: 'success',
        onPrimary: () => router.push(`/verify-otp?email=${encodeURIComponent(email)}`),
      });
    } catch (error: any) {
      console.error('Forgot password failed:', error.response?.data?.message || error.message);
      showFeedback({
        title: t('common.error'),
        message: error?.response?.data?.message || error?.message || t('auth.something_went_wrong'),
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [email, router, showFeedback, t]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <BaseButton
            title={t('auth.back_to_login')}
            onPress={handleBack}
            variant="ghost"
            icon={isRTL ? ArrowRight : ArrowLeft}
            style={[styles.backButton, isRTL && styles.backButtonRtl]}
            disabled={loading}
          />
          <View style={styles.header}>
            <Logo size="md" />
          </View>
          <View style={styles.content}>
            <Text style={[styles.title, isRTL && styles.rtlText]}>{t('auth.forgot_password_title')}</Text>
            <Text style={[styles.subtitle, isRTL && styles.rtlText]}>
              {t('auth.forgot_password_desc')}
            </Text>
            <BaseInput
              label={t('auth.email_label')}
              placeholder={t('auth.email_placeholder')}
              icon={Mail}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!loading}
            />
            <BaseButton
              title={t('auth.send_reset_link')}
              onPress={handleResetRequest}
              loading={loading}
              style={styles.submitButton}
              disabled={loading || !email}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


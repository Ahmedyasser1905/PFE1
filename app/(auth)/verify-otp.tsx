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
import { ShieldCheck, ArrowLeft, ArrowRight } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
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

export default function VerifyOtpScreen() {
  const { email } = useLocalSearchParams();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const { showFeedback } = useFeedback();
  const router = useRouter();
  const { t, isRTL } = useLanguage();

  const handleBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/(auth)/forgot-password');
  }, [router]);

  const handleVerifyOtp = useCallback(async () => {
    if (!otp) {
      showFeedback({ title: t('common.error'), message: t('auth.enter_reset_token'), type: 'warning' });
      return;
    }
    try {
      setLoading(true);
      await authApi.verifyOtp(email as string, otp);
      router.push(
        `/reset-password?email=${encodeURIComponent(email as string)}&token=${encodeURIComponent(
          otp
        )}`
      );
    } catch (error: any) {
      console.error('Token verification failed:', error.response?.data?.message || error.message);
      showFeedback({
        title: t('common.error'),
        message: error?.response?.data?.message || error?.message || t('auth.invalid_expired_token'),
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [otp, email, router, showFeedback, t]);

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
            title={t('common.back')}
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
            <Text style={[styles.title, isRTL && styles.rtlText]}>{t('auth.verify_token_title')}</Text>
            <Text style={[styles.subtitle, isRTL && styles.rtlText]}>
              {t('auth.verify_token_desc', { email: String(email) })}
            </Text>
            <BaseInput
              label={t('auth.reset_token_label')}
              placeholder={t('auth.reset_token_placeholder')}
              icon={ShieldCheck}
              value={otp}
              onChangeText={setOtp}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
            <BaseButton
              title={t('auth.verify_code_btn')}
              onPress={handleVerifyOtp}
              loading={loading}
              style={styles.submitButton}
              disabled={loading || !otp}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


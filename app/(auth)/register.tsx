import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Lock, User, ArrowRight } from 'lucide-react-native';
import { Link, useRouter } from 'expo-router';
import { theme } from '~/constants/theme';
import { Logo } from '~/components/ui/Logo';
import { BaseInput } from '~/components/ui/BaseInput';
import { BaseButton } from '~/components/ui/BaseButton';
import { useAuth } from '~/context/AuthContext';
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
  header: {
    marginBottom: theme.spacing.xl,
  } as ViewStyle,
  content: {
    flex: 1,
  } as ViewStyle,
  title: {
    ...theme.typography.h1,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  } as TextStyle,
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xxl,
  } as TextStyle,
  agreeContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: theme.spacing.xl,
    gap: theme.spacing.md,
  } as ViewStyle,
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: theme.roundness.sm,
    borderWidth: 2,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    marginTop: 2,
  } as ViewStyle,
  checkboxChecked: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  } as ViewStyle,
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: theme.colors.white,
  } as ViewStyle,
  agreeText: {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
    flex: 1,
    lineHeight: 20,
    fontWeight: '500',
  } as TextStyle,
  linkTextInline: {
    color: theme.colors.primary,
    fontWeight: '700',
  } as TextStyle,
  registerButton: {
    height: 56,
    borderRadius: theme.roundness.xl,
    marginBottom: theme.spacing.xl,
    ...theme.shadows.sm,
  } as ViewStyle,
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  } as ViewStyle,
  footerText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  } as TextStyle,
  linkText: {
    ...theme.typography.bodyBold,
    color: theme.colors.primary,
  } as TextStyle,
  rtlRow: {
    flexDirection: 'row-reverse',
  } as ViewStyle,
  rtlText: {
    textAlign: 'right',
  } as TextStyle,
});

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login, user, loading: authLoading } = useAuth();
  const { showFeedback } = useFeedback();
  const { t, isRTL } = useLanguage();

  useEffect(() => {
    if (user && !authLoading) {
      router.replace('/(dashboard)');
    }
  }, [user, authLoading, router]);

  const handleToggleAgreed = useCallback(() => {
    setAgreed((prev) => !prev);
  }, []);

  const handleLoginLink = useCallback(() => {
    router.replace('/login?mode=form');
  }, [router]);

  const handleRegister = useCallback(async () => {
    if (!name || !email || !password) {
      showFeedback({ title: t('common.error'), message: t('auth.fill_all_fields'), type: 'warning' });
      return;
    }
    if (password !== confirmPassword) {
      showFeedback({ title: t('common.error'), message: t('auth.passwords_no_match'), type: 'warning' });
      return;
    }
    if (!agreed) {
      showFeedback({
        title: t('common.error'),
        message: t('auth.agree_terms_required'),
        type: 'warning',
      });
      return;
    }
    try {
      setLoading(true);
      const response = await authApi.register({
        name,
        email,
        password,
      });

      await login(response.user, response.accessToken, response.refreshToken);
      router.replace('/(dashboard)');
    } catch (error: any) {
      console.error('Registration failed:', error?.message);
      showFeedback({
        title: t('auth.registration_failed'),
        message: error?.response?.data?.message || error?.message || t('auth.server_error'),
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [name, email, password, confirmPassword, agreed, login, router, showFeedback, t]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Logo size="md" />
          </View>
          <View style={styles.content}>
            <Text style={[styles.title, isRTL && styles.rtlText]}>{t('auth.create_account')}</Text>
            <Text style={[styles.subtitle, isRTL && styles.rtlText]}>{t('auth.create_account_desc')}</Text>
            <BaseInput
              label={t('auth.full_name_label')}
              placeholder={t('auth.full_name_placeholder')}
              icon={User}
              value={name}
              onChangeText={setName}
              editable={!loading}
            />
            <BaseInput
              label={t('auth.email_label')}
              placeholder={t('auth.email_placeholder')}
              icon={Mail}
              value={email}
              onChangeText={setEmail}
              editable={!loading}
              keyboardType="email-address"
            />
            <BaseInput
              label={t('auth.password_label')}
              placeholder={t('auth.password_dots')}
              icon={Lock}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
            />
            <BaseInput
              label={t('auth.confirm_password_label')}
              placeholder={t('auth.password_dots')}
              icon={Lock}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              editable={!loading}
            />
            <Pressable
              style={[styles.agreeContainer, isRTL && styles.rtlRow]}
              onPress={handleToggleAgreed}
              disabled={loading}
            >
              <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                {agreed && <View style={styles.checkboxInner} />}
              </View>
              <Text style={[styles.agreeText, isRTL && styles.rtlText]}>
                {t('auth.agree_prefix')}
                <Text style={styles.linkTextInline} onPress={() => router.push('/(auth)/terms')}>
                  {t('auth.terms_link')}
                </Text>{' '}
                {t('auth.and')}{' '}
                <Text style={styles.linkTextInline} onPress={() => router.push('/(auth)/privacy')}>
                  {t('auth.privacy_link')}
                </Text>
                .
              </Text>
            </Pressable>
            <BaseButton
              title={t('auth.create_account_btn')}
              onPress={handleRegister}
              loading={loading}
              icon={ArrowRight}
              style={styles.registerButton}
              disabled={loading || !name || !email || !password || !agreed}
            />
            <View style={[styles.footer, isRTL && styles.rtlRow]}>
              <Text style={styles.footerText}>{t('auth.already_have_account')}</Text>
              <Pressable onPress={handleLoginLink} disabled={loading}>
                <Text style={styles.linkText}>{t('auth.login')}</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


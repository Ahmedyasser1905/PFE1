import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, User, Mail, Save } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { theme } from '~/constants/theme';
import { useUser } from '~/hooks/useUser';
import { useLanguage } from '~/context/LanguageContext';
import { resolveImageUrl } from '~/utils/imageResolver';
import { settingsApi } from '~/api/api';
import { useFeedback } from '~/context/FeedbackContext';
import { useAuth } from '~/context/AuthContext';

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme.colors.background 
  } as ViewStyle,

  rtlRow: { flexDirection: 'row-reverse' } as ViewStyle,
  rtlText: { textAlign: 'right' } as TextStyle,

  scroll: { 
    padding: theme.spacing.lg, 
    paddingBottom: 60 
  } as ViewStyle,

  avatarSection: { 
    alignItems: 'center', 
    marginBottom: theme.spacing.xxl 
  } as ViewStyle,
  avatarWrapper: { 
    position: 'relative', 
    marginBottom: theme.spacing.sm 
  } as ViewStyle,
  avatarImage: {
    width: 110, 
    height: 110, 
    borderRadius: 55,
    borderWidth: 4, 
    borderColor: theme.colors.primaryLight,
    ...theme.shadows.md,
  } as ImageStyle,
  avatarPlaceholder: {
    width: 110, 
    height: 110, 
    borderRadius: 55,
    backgroundColor: theme.colors.primary,
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 4, 
    borderColor: theme.colors.primaryLight,
    ...theme.shadows.md,
  } as ViewStyle,
  avatarInitials: { 
    color: theme.colors.white, 
    fontSize: 42, 
    fontWeight: '800' 
  } as TextStyle,
  avatarHint: { 
    ...theme.typography.caption,
    color: theme.colors.textMuted, 
    fontWeight: '600' 
  } as TextStyle,

  section: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.roundness.xxl,
    padding: theme.spacing.xl,
    gap: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.xs,
  } as ViewStyle,
  sectionTitle: { 
    ...theme.typography.caption,
    fontWeight: '900', 
    color: theme.colors.textSecondary, 
    textTransform: 'uppercase', 
    letterSpacing: 1 
  } as TextStyle,

  field: { gap: theme.spacing.xs } as ViewStyle,
  fieldLabelRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: theme.spacing.sm 
  } as ViewStyle,
  fieldLabel: { 
    ...theme.typography.small,
    fontWeight: '700', 
    color: theme.colors.textSecondary 
  } as TextStyle,

  inputEditable: {
    borderWidth: 1.5, 
    borderColor: theme.colors.border,
    borderRadius: theme.roundness.md, 
    paddingHorizontal: theme.spacing.lg, 
    paddingVertical: 14,
    backgroundColor: theme.colors.white,
    ...theme.typography.bodyMedium,
    color: theme.colors.text,
  } as TextStyle,

  inputReadOnly: {
    borderWidth: 1.5, 
    borderColor: theme.colors.surface,
    borderRadius: theme.roundness.md, 
    paddingHorizontal: theme.spacing.lg, 
    paddingVertical: 14,
    backgroundColor: theme.colors.surface,
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
  } as ViewStyle,
  inputReadOnlyText: { 
    ...theme.typography.bodyMedium,
    color: theme.colors.textSecondary, 
    flex: 1 
  } as TextStyle,
  readOnlyBadge: {
    backgroundColor: 'rgba(0,0,0,0.05)', 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: theme.roundness.sm,
  } as ViewStyle,
  readOnlyBadgeText: { 
    ...theme.typography.caption,
    fontSize: 10,
    fontWeight: '800', 
    color: theme.colors.textMuted 
  } as TextStyle,

  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: theme.roundness.xl,
    ...theme.shadows.md,
  } as ViewStyle,
  saveBtnDisabled: {
    opacity: 0.6,
  } as ViewStyle,
  saveBtnText: {
    color: theme.colors.white,
    ...theme.typography.bodyBold,
    fontWeight: '700',
  } as TextStyle,
});

export default function PersonalInfoScreen() {
  const router = useRouter();
  const { user, name, email } = useUser();
  const { t, language } = useLanguage();
  const { updateUser } = useAuth();
  const { showSuccess, showError } = useFeedback();
  const isArabic = language === 'ar';

  const [editName, setEditName] = useState(name || '');
  const [saving, setSaving] = useState(false);

  const initials = (name || 'U').charAt(0).toUpperCase();

  const hasChanges = editName.trim() !== (name || '');

  const handleSave = useCallback(async () => {
    if (!hasChanges || saving) return;
    
    const trimmedName = editName.trim();
    if (trimmedName.length < 3) {
      showError('Invalid Name', 'Name must be at least 3 characters.');
      return;
    }

    try {
      setSaving(true);
      await settingsApi.updateProfile({ name: trimmedName, language: language as 'en' | 'ar' });
      await updateUser({ name: trimmedName });
      showSuccess('Profile Updated', 'Your personal info has been saved.');
    } catch (err: any) {
      // Error is already handled by the API interceptor
      console.error('[PersonalInfo] Save error:', err);
    } finally {
      setSaving(false);
    }
  }, [editName, hasChanges, saving, language, updateUser, showSuccess, showError]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            {user?.avatarUrl ? (
              <Image
                source={{ uri: resolveImageUrl(user.avatarUrl) }}
                style={styles.avatarImage}
                contentFit="cover"
                transition={200}
                onError={() => {
                  if (__DEV__) console.log('[PersonalInfo] avatar load failed:', user.avatarUrl);
                }}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
          </View>
          <Text style={styles.avatarHint}>{t('settings.read_only')}</Text>
        </View>

        {/* Form Fields */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isArabic && styles.rtlText]}>{t('settings.account_details')}</Text>

          {/* Name — editable (Plan §13: PATCH /api/settings) */}
          <View style={styles.field}>
            <View style={[styles.fieldLabelRow, isArabic && styles.rtlRow]}>
              <User size={15} color="#64748B" />
              <Text style={styles.fieldLabel}>{t('settings.full_name')}</Text>
            </View>
            <TextInput
              style={[styles.inputEditable, isArabic && styles.rtlText]}
              value={editName}
              onChangeText={setEditName}
              placeholder="Enter your name"
              placeholderTextColor={theme.colors.textMuted}
              editable={!saving}
              autoCapitalize="words"
            />
          </View>

          {/* Email — read only */}
          <View style={styles.field}>
            <View style={[styles.fieldLabelRow, isArabic && styles.rtlRow]}>
              <Mail size={15} color="#64748B" />
              <Text style={styles.fieldLabel}>{t('auth.email_label')}</Text>
            </View>
            <View style={[styles.inputReadOnly, isArabic && styles.rtlRow]}>
              <Text style={[styles.inputReadOnlyText, isArabic && styles.rtlText]}>
                {email || '—'}
              </Text>
              <View style={styles.readOnlyBadge}>
                <Text style={styles.readOnlyBadgeText}>{t('settings.read_only')}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveBtn, (!hasChanges || saving) && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!hasChanges || saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color={theme.colors.white} />
          ) : (
            <>
              <Save size={20} color={theme.colors.white} />
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
    );
}

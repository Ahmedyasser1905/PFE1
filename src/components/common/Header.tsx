import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { User as UserIcon } from 'lucide-react-native';
import BackButton from './BackButton';
import { theme } from '~/constants/theme';
import { useUser } from '~/hooks/useUser';
import { useLanguage } from '~/context/LanguageContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Header = () => {
  const { name, user } = useUser();
  const { t, language } = useLanguage();
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();

  const isArabic = language === 'ar';

  // Navigation Logic
  const isRoot = segments.length <= 1 || (segments[0] === '(dashboard)' && segments.length === 1);
  const showBack = !isRoot;
  
  // Custom Title Mapping
  const getHeaderTitle = () => {
    if (isRoot) return "Apex";
    
    if (segments.includes('projects')) {
       if (segments.includes('[id]')) return t('common.project_details');
       return t('navigation.projects');
    }
    if (segments.includes('calculations')) return t('common.calc_engine');
    if (segments.includes('estimation-history')) return t('navigation.history');
    if (segments.includes('all-calculations')) return t('common.all_activities');
    if (segments.includes('settings')) return t('navigation.settings');
    if (segments.includes('chat')) return t('navigation.chat');
    
    return "Apex";
  };

  if (!user) return null;

  return (
    <View style={[
      styles.headerContainer, 
      { paddingTop: insets.top },
      isArabic && styles.rtlHeader
    ]}>
      <View style={[styles.leftSection, isArabic && styles.rtlLeftSection]}>
        {showBack && <BackButton size={24} />}
        <View style={[styles.titleWrapper, isArabic && styles.rtlTitleWrapper]}>
          <Text style={[styles.appTitle, isArabic && styles.rtlText]}>{getHeaderTitle()}</Text>
          {isRoot && (
             <Text style={[styles.welcomeText, isArabic && styles.rtlText]}>
               {t('common.hello')}, {name.split(' ')[0]}
             </Text>
          )}
        </View>
      </View>

      <View style={[styles.rightSection, isArabic && styles.rtlRightSection]}>
        {isRoot ? (
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => router.push('/settings')}
            activeOpacity={0.8}
          >
            <View style={styles.avatar}>
               <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => router.push('/settings')}
            activeOpacity={0.7}
          >
            <UserIcon size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: theme.colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
    ...theme.shadows.xs,
  },
  rtlHeader: {
    flexDirection: 'row-reverse',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  rtlLeftSection: {
    flexDirection: 'row-reverse',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrapper: {
    justifyContent: 'center',
  },
  rtlTitleWrapper: {
    alignItems: 'flex-end',
  },
  appTitle: {
    ...theme.typography.h4,
    color: theme.colors.text,
  },
  welcomeText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: -2,
  },
  rtlText: {
    textAlign: 'right',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  rtlRightSection: {
    flexDirection: 'row-reverse',
  },
  profileButton: {
    padding: theme.spacing.xs,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.sm,
  },
  avatarText: {
    color: theme.colors.white,
    fontWeight: '800',
    fontSize: 16,
  },
});

export default memo(Header);

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield } from 'lucide-react-native';
import { theme } from '~/constants/theme';
import { useLanguage } from '~/context/LanguageContext';
import BackButton from '~/components/common/BackButton';

export default function PrivacyScreen() {
  const { t, isRTL } = useLanguage();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={[styles.header, isRTL && { flexDirection: 'row-reverse' }]}>
        <BackButton />
        <Text style={styles.title}>{t('settings.privacy') || 'Privacy Policy'}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.iconCircle}>
          <Shield size={32} color={theme.colors.primary} />
        </View>

        <Text style={styles.lastUpdated}>{t('privacy_auth.last_updated')}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('privacy_auth.section_1_title')}</Text>
          <Text style={styles.text}>
            {t('privacy_auth.section_1_content')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('privacy_auth.section_2_title')}</Text>
          <Text style={styles.text}>
            {t('privacy_auth.section_2_content')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('privacy_auth.section_3_title')}</Text>
          <Text style={styles.text}>
            {t('privacy_auth.section_3_content')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('privacy_auth.section_4_title')}</Text>
          <Text style={styles.text}>
            {t('privacy_auth.section_4_content')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800', color: '#0F172A' },
  content: { padding: 24, alignItems: 'center' },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  lastUpdated: { fontSize: 12, color: '#94A3B8', fontWeight: '600', marginBottom: 32 },
  section: { width: '100%', marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B', marginBottom: 8 },
  text: { fontSize: 14, color: '#64748B', lineHeight: 22 },
});

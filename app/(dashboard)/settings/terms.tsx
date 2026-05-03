import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, FileText, Shield, Gavel } from 'lucide-react-native';
import { theme } from '~/constants/theme';
import { useLanguage } from '~/context/LanguageContext';

export default function TermsScreen() {
  const router = useRouter();
  const { t, isRTL } = useLanguage();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.iconCircle}>
          <Gavel size={32} color={theme.colors.primary} />
        </View>

        <Text style={styles.lastUpdated}>Last Updated: May 2024</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.text}>
            By accessing and using Apex, you agree to be bound by these Terms of Service. If you do not agree, please do not use the application.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Use of Services</Text>
          <Text style={styles.text}>
            Apex is a construction estimation tool. Calculations provided are estimates based on user input and standard formulas. Users are responsible for verifying all final quantities.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Account Security</Text>
          <Text style={styles.text}>
            You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Limitation of Liability</Text>
          <Text style={styles.text}>
            Apex is not liable for any construction errors, financial losses, or project delays resulting from the use of our estimation tools.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background } as ViewStyle,
  content: { padding: theme.spacing.xl, alignItems: 'center' } as ViewStyle,
  iconCircle: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: theme.colors.primaryLight, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 16 
  } as ViewStyle,
  lastUpdated: { 
    ...theme.typography.caption,
    color: theme.colors.textMuted, 
    fontWeight: '600', 
    marginBottom: 32 
  } as TextStyle,
  section: { width: '100%', marginBottom: 24 } as ViewStyle,
  sectionTitle: { 
    ...theme.typography.bodyBold,
    color: theme.colors.text, 
    marginBottom: 8 
  } as TextStyle,
  text: { 
    ...theme.typography.small,
    color: theme.colors.textSecondary, 
    lineHeight: 22 
  } as TextStyle,
});

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, LayoutAnimation,
  Platform, UIManager, Linking, ViewStyle, TextStyle
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronDown, ChevronUp, HelpCircle, MessageCircle, Mail, Phone } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { theme } from '~/constants/theme';
import { useLanguage } from '~/context/LanguageContext';

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme.colors.background 
  } as ViewStyle,

  rtlRow: { flexDirection: 'row-reverse' } as ViewStyle,

  scroll: { 
    padding: theme.spacing.lg, 
    paddingBottom: 60 
  } as ViewStyle,

  hero: { 
    alignItems: 'center', 
    marginBottom: theme.spacing.xxl 
  } as ViewStyle,
  heroIcon: {
    width: 80, 
    height: 80, 
    borderRadius: 40,
    backgroundColor: theme.colors.primaryLight, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  } as ViewStyle,
  heroTitle: { 
    ...theme.typography.h2,
    color: theme.colors.text, 
    marginBottom: 8 
  } as TextStyle,
  heroSub: { 
    ...theme.typography.body,
    color: theme.colors.textSecondary, 
    textAlign: 'center', 
    lineHeight: 22, 
    paddingHorizontal: 10 
  } as TextStyle,

  sectionLabel: {
    ...theme.typography.caption,
    fontWeight: '900', 
    color: theme.colors.textMuted,
    letterSpacing: 1.5, 
    marginBottom: theme.spacing.md, 
    marginLeft: 4,
    textTransform: 'uppercase',
  } as TextStyle,

  accordionCard: {
    backgroundColor: theme.colors.white, 
    borderRadius: theme.roundness.xl,
    borderWidth: 1, 
    borderColor: theme.colors.divider,
    overflow: 'hidden', 
    marginBottom: theme.spacing.xl,
    ...theme.shadows.sm,
  } as ViewStyle,
  accordionItem: { padding: 0 } as ViewStyle,
  accordionBorder: { 
    borderTopWidth: 1, 
    borderColor: theme.colors.divider 
  } as ViewStyle,
  accordionHeader: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg, 
    paddingVertical: theme.spacing.lg, 
    gap: theme.spacing.md,
  } as ViewStyle,
  accordionLeft: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: theme.spacing.md, 
    flex: 1 
  } as ViewStyle,
  questionNum: {
    width: 28, 
    height: 28, 
    borderRadius: 14,
    backgroundColor: theme.colors.primaryLight, 
    alignItems: 'center', 
    justifyContent: 'center',
    flexShrink: 0,
  } as ViewStyle,
  questionNumText: { 
    ...theme.typography.small,
    fontWeight: '800', 
    color: theme.colors.primary 
  } as TextStyle,
  questionText: { 
    ...theme.typography.bodyBold,
    color: theme.colors.text, 
    flex: 1, 
    lineHeight: 20 
  } as TextStyle,
  accordionBody: {
    paddingHorizontal: theme.spacing.lg, 
    paddingBottom: theme.spacing.lg, 
    paddingTop: 0,
    paddingLeft: 60,
  } as ViewStyle,
  answerText: { 
    ...theme.typography.body,
    color: theme.colors.textSecondary, 
    lineHeight: 22 
  } as TextStyle,

  contactCard: {
    backgroundColor: theme.colors.white, 
    borderRadius: theme.roundness.xl,
    borderWidth: 1, 
    borderColor: theme.colors.divider,
    overflow: 'hidden', 
    marginBottom: theme.spacing.xl,
    ...theme.shadows.sm,
  } as ViewStyle,
  contactRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: theme.spacing.md, 
    padding: theme.spacing.lg 
  } as ViewStyle,
  contactDivider: { 
    height: 1, 
    backgroundColor: theme.colors.divider, 
    marginHorizontal: theme.spacing.lg 
  } as ViewStyle,
  contactIcon: { 
    width: 48, 
    height: 48, 
    borderRadius: theme.roundness.md, 
    alignItems: 'center', 
    justifyContent: 'center' 
  } as ViewStyle,
  contactInfo: { flex: 1 } as ViewStyle,
  contactTitle: { 
    ...theme.typography.bodyBold,
    color: theme.colors.text, 
    marginBottom: 2 
  } as TextStyle,
  contactSub: { 
    ...theme.typography.small,
    color: theme.colors.textSecondary 
  } as TextStyle,

  version: { 
    textAlign: 'center', 
    ...theme.typography.caption,
    color: theme.colors.textMuted, 
    fontWeight: '700', 
    marginTop: 8 
  } as TextStyle,
});

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQ_ITEMS = [
  {
    q: 'How do I create a new project?',
    a: 'From the Home tab, tap the "Create Project" card at the top. Fill in the project details including name, location, and budget, then tap Save.',
  },
  {
    q: 'How does the calculation engine work?',
    a: 'Navigate to the Calculations tab inside a project. Choose a category (e.g., Foundations), then a sub-category, enter your dimensions, and tap Calculate. Results are displayed immediately and can be saved to your project history.',
  },
  {
    q: 'Can I use the app offline?',
    a: 'Yes! Calculations and saved project data are stored locally on your device. You only need an internet connection to log in, sync projects, or use the AI assistant.',
  },
  {
    q: 'How do I change the app language?',
    a: 'Go to Settings → Language. You can switch between English and Arabic. The app will update immediately without needing to restart.',
  },
  {
    q: 'How do I reset my password?',
    a: 'On the login screen, tap "Forgot Password". Enter your email address, and you\'ll receive a 6-digit OTP code. Enter the code, then set your new password.',
  },
  {
    q: 'Are prices in the calculations accurate?',
    a: 'The calculations use reference unit prices based on Algerian market averages. They are meant for estimation only. Always consult local suppliers for current prices.',
  },
  {
    q: 'How do I delete a project?',
    a: 'Open the project, then tap the options menu (three dots) in the top right corner. You\'ll see a "Delete Project" option. This action is permanent.',
  },
  {
    q: 'What is a completed project?',
    a: 'When you mark a project as "Completed", all its calculations become read-only (locked). This preserves a final archive of the estimation for that project.',
  },
];

function AccordionItem({ item, index }: { item: typeof FAQ_ITEMS[0]; index: number }) {
  const [open, setOpen] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen(!open);
  };

  return (
    <View style={[styles.accordionItem, index > 0 && styles.accordionBorder]}>
      <TouchableOpacity style={styles.accordionHeader} onPress={toggle} activeOpacity={0.7}>
        <View style={styles.accordionLeft}>
          <View style={styles.questionNum}>
            <Text style={styles.questionNumText}>{index + 1}</Text>
          </View>
          <Text style={styles.questionText}>{item.q}</Text>
        </View>
        {open
          ? <ChevronUp size={18} color={theme.colors.primary} />
          : <ChevronDown size={18} color={theme.colors.textMuted} />
        }
      </TouchableOpacity>
      {open && (
        <View style={styles.accordionBody}>
          <Text style={styles.answerText}>{item.a}</Text>
        </View>
      )}
    </View>
  );
}

export default function HelpScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <HelpCircle size={36} color={theme.colors.primary} />
          </View>
          <Text style={styles.heroTitle}>How can we help?</Text>
          <Text style={styles.heroSub}>Find answers to common questions below, or reach out to our support team.</Text>
        </View>

        {/* FAQ */}
        <Text style={styles.sectionLabel}>FREQUENTLY ASKED QUESTIONS</Text>
        <View style={styles.accordionCard}>
          {FAQ_ITEMS.map((item, i) => (
            <AccordionItem key={i} item={item} index={i} />
          ))}
        </View>

        {/* Contact */}
        <Text style={styles.sectionLabel}>CONTACT SUPPORT</Text>
        <View style={styles.contactCard}>
          <TouchableOpacity
            style={styles.contactRow}
            onPress={() => Linking.openURL('mailto:support@apex.dz')}
          >
            <View style={[styles.contactIcon, { backgroundColor: theme.colors.infoLight }]}>
              <Mail size={20} color={theme.colors.info} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Email Us</Text>
              <Text style={styles.contactSub}>support@apex.dz</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.contactDivider} />

          <TouchableOpacity
            style={styles.contactRow}
            onPress={() => Linking.openURL('https://wa.me/213XXXXXXXXX')}
          >
            <View style={[styles.contactIcon, { backgroundColor: theme.colors.successLight }]}>
              <MessageCircle size={20} color={theme.colors.success} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>WhatsApp</Text>
              <Text style={styles.contactSub}>Chat with support</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>Apex © 2026 — v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}


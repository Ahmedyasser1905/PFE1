import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, StatusBar, ViewStyle, TextStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Gavel } from 'lucide-react-native';
import { theme } from '~/constants/theme';
import BackButton from '~/components/common/BackButton';
import { useLanguage } from '~/context/LanguageContext';

export default function TermsScreen() {
    const { t, isRTL } = useLanguage();
    
    const sections = [
        {
            title: t('terms.section_1_title'),
            content: t('terms.section_1_content')
        },
        {
            title: t('terms.section_2_title'),
            content: t('terms.section_2_content')
        },
        {
            title: t('terms.section_3_title'),
            content: t('terms.section_3_content')
        },
        {
            title: t('terms.section_4_title'),
            content: t('terms.section_4_content')
        },
        {
            title: t('terms.section_5_title'),
            content: t('terms.section_5_content')
        },
        {
            title: t('terms.section_6_title'),
            content: t('terms.section_6_content')
        }
    ];

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={[styles.header, isRTL && styles.rtlRow]}>
                <BackButton size={24} fallbackHref="/(auth)/login" />
                <Text style={styles.headerTitle}>{t('terms.header_title')}</Text>
                <View style={{ width: 44 }} />
            </View>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.iconContainer}>
                    <View style={styles.iconCircle}>
                        <Gavel size={32} color="white" />
                    </View>
                    <Text style={styles.title}>{t('terms.page_title')}</Text>
                    <Text style={styles.lastUpdated}>{t('terms.last_updated')}</Text>
                </View>
                {sections.map((section, index) => (
                    <View key={index} style={styles.section}>
                        <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>{section.title}</Text>
                        <Text style={[styles.sectionContent, isRTL && styles.rtlText]}>{section.content}</Text>
                    </View>
                ))}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        {t('terms.footer')}
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    } as ViewStyle,
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 10 : 0,
        paddingBottom: 15,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    } as ViewStyle,
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text,
    } as TextStyle,
    scrollContent: {
        padding: theme.spacing.lg,
        paddingBottom: 40,
    } as ViewStyle,
    iconContainer: {
        alignItems: 'center',
        marginVertical: 32,
    } as ViewStyle,
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    } as ViewStyle,
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#0f172a',
        textAlign: 'center',
    } as TextStyle,
    lastUpdated: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 8,
    } as TextStyle,
    section: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    } as ViewStyle,
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e40af',
        marginBottom: 12,
        textAlign: 'left',
    } as TextStyle,
    sectionContent: {
        fontSize: 15,
        color: '#334155',
        lineHeight: 24,
        textAlign: 'left',
    } as TextStyle,
    footer: {
        padding: 20,
        alignItems: 'center',
    } as ViewStyle,
    footerText: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 20,
    } as TextStyle,
    rtlRow: {
        flexDirection: 'row-reverse',
    } as ViewStyle,
    rtlText: {
        textAlign: 'right',
    } as TextStyle,
});

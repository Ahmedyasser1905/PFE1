import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, StatusBar, ViewStyle, TextStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Gavel } from 'lucide-react-native';
import { theme } from '~/constants/theme';
import BackButton from '~/components/common/BackButton';

export default function TermsScreen() {
    const sections = [
        {
            title: '1. Acceptance of Terms',
            content: 'By accessing and using Apex, you agree to bound by these Terms and Conditions. If you do not agree with any part of these terms, you must not use our services.'
        },
        {
            title: '2. Use of Services',
            content: 'Apex provides tools for construction estimation and project management. You agree to use these services only for lawful purposes and in accordance with these Terms.'
        },
        {
            title: '3. AI Usage Policy',
            content: 'Our AI-powered estimation tools are designed to assist you. However, final verification of all calculations and estimates remains the sole responsibility of the user. Apex is not liable for errors in construction resulting from AI-generated data.'
        },
        {
            title: '4. User Accounts',
            content: 'You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.'
        },
        {
            title: '5. Intellectual Property',
            content: 'The Apex name, logo, and all related content and technology are the exclusive property of Apex. You may not reproduce or distribute any part of the service without prior written consent.'
        },
        {
            title: '6. Limitation of Liability',
            content: 'Apex shall not be liable for any indirect, incidental, special, or consequential damages resulting from the use or inability to use our services.'
        }
    ];
    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <BackButton size={24} fallbackHref="/(auth)/login" />
                <Text style={styles.headerTitle}>Terms & Conditions</Text>
                <View style={{ width: 44 }} />
            </View>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.iconContainer}>
                    <View style={styles.iconCircle}>
                        <Gavel size={32} color="white" />
                    </View>
                    <Text style={styles.title}>Apex Terms of Service</Text>
                    <Text style={styles.lastUpdated}>Last updated: March 7, 2026</Text>
                </View>
                {sections.map((section, index) => (
                    <View key={index} style={styles.section}>
                        <Text style={styles.sectionTitle}>{section.title}</Text>
                        <Text style={styles.sectionContent}>{section.content}</Text>
                    </View>
                ))}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        If you have any questions regarding these terms, please contact our legal team at legal@apex.com
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
    } as TextStyle,
    sectionContent: {
        fontSize: 15,
        color: '#334155',
        lineHeight: 24,
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
});

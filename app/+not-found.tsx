import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Home, Compass, Map } from 'lucide-react-native';
import { useLanguage } from '~/context/LanguageContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '~/constants/theme';
import { BaseButton } from '~/components/ui/BaseButton';
export default function NotFoundScreen() {
    const router = useRouter();
    const { t } = useLanguage();
    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ title: 'Oops!', headerShown: false }} />
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Map size={80} color={theme.colors.primary} />
                    <View style={styles.ghostIcon}>
                        <Compass size={40} color="white" />
                    </View>
                </View>
                <Text style={styles.errorCode}>{t('not_found.error_code') || '404'}</Text>
                <Text style={styles.title}>{t('not_found.title') || 'Lost on the Job Site?'}</Text>
                <Text style={styles.subtitle}>
                    {t('not_found.subtitle') || "We couldn't find the page you're looking for. It might have been moved, deleted, or never existed in the blue prints."}
                </Text>
                <BaseButton
                    title={t('not_found.back_to_dashboard') || "Back to Dashboard"}
                    onPress={() => router.replace('/(dashboard)')}
                    icon={Home}
                    style={styles.button}
                />
                <TouchableOpacity
                    style={styles.link}
                    onPress={() => router.back()}
                >
                    <Text style={styles.linkText}>{t('not_found.go_back_previous') || 'Go back to previous page'}</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.footer}>
                <Text style={styles.footerText}>{t('not_found.footer') || 'Apex Error Reporting System'}</Text>
            </View>
        </SafeAreaView>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
    },
    iconContainer: {
        position: 'relative',
        marginBottom: 32,
    },
    ghostIcon: {
        position: 'absolute',
        bottom: -10,
        right: -10,
        backgroundColor: theme.colors.primary,
        padding: 8,
        borderRadius: 20,
        borderWidth: 4,
        borderColor: '#f8fafc',
    },
    errorCode: {
        fontSize: 14,
        fontWeight: '900',
        color: theme.colors.primary,
        letterSpacing: 4,
        marginBottom: 8,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: theme.colors.text,
        textAlign: 'center',
        marginBottom: 16,
    },
    subtitle: {
        fontSize: 16,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 40,
    },
    button: {
        width: '100%',
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 4,
    },
    link: {
        marginTop: 24,
        padding: 12,
    },
    linkText: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.textSecondary,
        textDecorationLine: 'underline',
    },
    footer: {
        padding: 24,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: theme.colors.placeholder,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
});


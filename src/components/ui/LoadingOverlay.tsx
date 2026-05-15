import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { theme } from '~/constants/theme';
import { useLanguage } from '~/context/LanguageContext';

export const LoadingOverlay = () => {
    const { t } = useLanguage();

    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.text}>{t('common.loading') || 'Loading...'}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9998, 
    },
    text: {
        marginTop: 16,
        fontSize: 14,
        color: theme.colors.textSecondary,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
});



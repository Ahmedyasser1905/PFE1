import React from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView } from 'react-native';
import { WifiOff, ServerCrash, AlertTriangle, RefreshCcw } from 'lucide-react-native';
import { useLanguage } from '~/context/LanguageContext';

export type ErrorType = 'network' | 'server' | 'unknown';

interface ErrorScreenProps {
  type?: ErrorType;
  title?: string;
  message?: string;
  onRetry?: () => void;
  fullScreen?: boolean;
}

export function ErrorScreen({
  type = 'unknown',
  title,
  message,
  onRetry,
  fullScreen = false,
}: ErrorScreenProps) {
  const { t } = useLanguage();
  
  const getErrorContent = () => {
    switch (type) {
      case 'network':
        return {
          icon: <WifiOff size={56} color="#ef4444" />,
          defaultTitle: t('errors.network_title') || 'No Internet Connection',
          defaultMessage: t('errors.network_msg') || 'Please check your connection and try again.',
        };
      case 'server':
        return {
          icon: <ServerCrash size={56} color="#f59e0b" />,
          defaultTitle: t('errors.server_title') || 'Server Unreachable',
          defaultMessage: t('errors.server_msg') || 'Our servers are currently down. We are working on it.',
        };
      case 'unknown':
      default:
        return {
          icon: <AlertTriangle size={56} color="#ef4444" />,
          defaultTitle: t('errors.unknown_title') || 'Something went wrong',
          defaultMessage: t('errors.unknown_msg') || 'An unexpected error occurred. Please try again later.',
        };
    }
  };

  const content = getErrorContent();
  const displayTitle = title || content.defaultTitle;
  const displayMessage = message || content.defaultMessage;

  const Container = fullScreen ? SafeAreaView : View;

  return (
    <Container style={[styles.container, fullScreen && styles.fullScreen]}>
      <View style={styles.iconContainer}>
        {content.icon}
      </View>
      <Text style={styles.title}>{displayTitle}</Text>
      <Text style={styles.message}>{displayMessage}</Text>
      
      {onRetry && (
        <Pressable style={styles.retryButton} onPress={onRetry}>
          <RefreshCcw size={18} color="#fff" />
          <Text style={styles.retryText}>{t('common.try_again') || 'Try Again'}</Text>
        </Pressable>
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#f8fafc',
  },
  fullScreen: {
    backgroundColor: '#fff',
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  iconContainer: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    gap: 8,
    elevation: 2,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});

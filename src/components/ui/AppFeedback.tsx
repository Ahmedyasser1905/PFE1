import React, { useEffect, useRef, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Animated,
  Dimensions,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Info, 
  X,
  WifiOff,
  Lock,
  RefreshCw
} from 'lucide-react-native';
import { theme } from '~/constants/theme';
import { useLanguage } from '~/context/LanguageContext';

const { width } = Dimensions.get('window');

export type FeedbackType = 'success' | 'error' | 'warning' | 'info' | 'network' | 'subscription';

interface AppFeedbackProps {
  visible: boolean;
  type?: FeedbackType;
  title: string;
  message?: string;
  loading?: boolean;
  primaryText?: string;
  secondaryText?: string;
  onPrimary?: () => void;
  onSecondary?: () => void;
  onClose?: () => void;
  autoClose?: boolean;
  autoCloseDuration?: number;
}

export const AppFeedback: React.FC<AppFeedbackProps> = ({
  visible,
  type = 'info',
  title,
  message,
  loading,
  primaryText,
  secondaryText,
  onPrimary,
  onSecondary,
  onClose,
  autoClose = false,
  autoCloseDuration = 3000,
}) => {
  const { t } = useLanguage();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  const handleClose = useCallback(() => {
    onClose?.();
  }, [onClose]);

  const handlePrimary = useCallback(() => {
    onPrimary?.();
  }, [onPrimary]);

  const handleSecondary = useCallback(() => {
    onSecondary?.();
  }, [onSecondary]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

      if (autoClose && !loading && type === 'success') {
        const timer = setTimeout(() => {
          handleClose();
        }, autoCloseDuration);
        return () => clearTimeout(timer);
      }
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.95);
    }
  }, [visible, autoClose, loading, type, autoCloseDuration, handleClose]);

  const getTheme = () => {
    switch (type) {
      case 'success':
        return { color: theme.colors.success, bg: theme.colors.successLight, icon: CheckCircle2 };
      case 'error':
        return { color: theme.colors.error, bg: theme.colors.errorLight, icon: XCircle };
      case 'warning':
        return { color: theme.colors.warning, bg: theme.colors.warningLight, icon: AlertTriangle };
      case 'network':
        return { color: theme.colors.textSecondary, bg: theme.colors.surface, icon: WifiOff };
      case 'subscription':
        return { color: theme.colors.primary, bg: theme.colors.primaryLight, icon: Lock };
      default:
        return { color: theme.colors.info, bg: theme.colors.infoLight, icon: Info };
    }
  };

  const statusTheme = getTheme();
  const Icon = statusTheme.icon;

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none">
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <Animated.View 
          style={[
            styles.container, 
            { 
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <View style={[styles.iconContainer, { backgroundColor: statusTheme.bg }]}>
            <Icon color={statusTheme.color} size={32} strokeWidth={2.5} />
          </View>

          <Pressable style={styles.closeBtn} onPress={handleClose}>
            <X size={20} color={theme.colors.textMuted} />
          </Pressable>

          <View style={styles.content}>
            <Text style={[styles.title, { color: statusTheme.color }]}>{title}</Text>
            {message ? <Text style={styles.message}>{message}</Text> : null}
            
            {loading && (
              <View style={styles.loadingArea}>
                <ActivityIndicator color={statusTheme.color} />
                <Text style={[styles.loadingText, { color: statusTheme.color }]}>{t('common.processing') || 'Processing...'}</Text>
              </View>
            )}
          </View>

          <View style={styles.actions}>
            {secondaryText && (
              <Pressable 
                style={[styles.btn, styles.secondaryBtn]} 
                onPress={handleSecondary}
                disabled={loading}
              >
                <Text style={styles.secondaryText}>{secondaryText}</Text>
              </Pressable>
            )}

            {primaryText && (
              <Pressable 
                style={[styles.btn, styles.primaryBtn, { backgroundColor: statusTheme.color }]} 
                onPress={handlePrimary}
                disabled={loading}
              >
                {type === 'network' ? (
                  <RefreshCw size={18} color={theme.colors.white} style={{ marginRight: 8 }} />
                ) : null}
                <Text style={styles.primaryText}>{primaryText}</Text>
              </Pressable>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: theme.colors.white,
    borderRadius: theme.roundness.xxl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    ...theme.shadows.lg,
  } as ViewStyle,
  closeBtn: {
    position: 'absolute',
    top: theme.spacing.lg,
    right: theme.spacing.lg,
    padding: theme.spacing.xs,
  } as ViewStyle,
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  } as ViewStyle,
  content: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  } as ViewStyle,
  title: {
    ...theme.typography.h3,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    color: theme.colors.text,
  } as TextStyle,
  message: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  } as TextStyle,
  loadingArea: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.lg,
    gap: theme.spacing.sm,
  } as ViewStyle,
  loadingText: {
    ...theme.typography.small,
    fontWeight: '700',
    color: theme.colors.primary,
  } as TextStyle,
  actions: {
    flexDirection: 'row',
    width: '100%',
    gap: theme.spacing.md,
  } as ViewStyle,
  btn: {
    flex: 1,
    height: 54,
    borderRadius: theme.roundness.lg,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  } as ViewStyle,
  primaryBtn: {
    ...theme.shadows.sm,
  } as ViewStyle,
  primaryText: {
    color: theme.colors.white,
    ...theme.typography.bodyBold,
  } as TextStyle,
  secondaryBtn: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.divider,
  } as ViewStyle,
  secondaryText: {
    color: theme.colors.textSecondary,
    ...theme.typography.bodyBold,
  } as TextStyle,
});
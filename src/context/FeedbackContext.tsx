import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { AppFeedback, FeedbackType } from '~/components/ui/AppFeedback';
import { useLanguage } from '~/context/LanguageContext';

interface FeedbackOptions {
  title: string;
  message?: string;
  type?: FeedbackType;
  primaryText?: string;
  secondaryText?: string;
  onPrimary?: () => void;
  onSecondary?: () => void;
  loading?: boolean;
  autoClose?: boolean;
}

interface FeedbackContextType {
  showFeedback: (options: FeedbackOptions) => void;
  hideFeedback: () => void;
  showSuccess: (title: string, message?: string, options?: Partial<FeedbackOptions>) => void;
  showError: (title: string, message?: string, options?: Partial<FeedbackOptions>) => void;
  showWarning: (title: string, message?: string, options?: Partial<FeedbackOptions>) => void;
  showInfo: (title: string, message?: string, options?: Partial<FeedbackOptions>) => void;
  showNetworkError: (onRetry?: () => void, options?: Partial<FeedbackOptions>) => void;
  showSubscription: (message?: string, onSubscribe?: () => void, options?: Partial<FeedbackOptions>) => void;
  showLoading: (title: string, message?: string, options?: Partial<FeedbackOptions>) => void;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

// Static holder for API layer access (non-React usage)
let globalShowFeedback: ((options: FeedbackOptions) => void) | null = null;

export const showGlobalFeedback = (options: FeedbackOptions) => {
  if (globalShowFeedback) {
    globalShowFeedback(options);
  } else {
    console.warn('[FeedbackContext] globalShowFeedback called before provider mount');
  }
};

export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<FeedbackOptions>({ title: '' });
  const { t } = useLanguage();

  const showFeedback = useCallback((options: FeedbackOptions) => {
    setConfig(options);
    setVisible(true);
  }, []);

  const hideFeedback = useCallback(() => {
    setVisible(false);
  }, []);

  // Update global holder
  React.useEffect(() => {
    globalShowFeedback = showFeedback;
    return () => { globalShowFeedback = null; };
  }, [showFeedback]);

  const showSuccess = useCallback((title: string, message?: string, options?: Partial<FeedbackOptions>) => {
    showFeedback({ 
      title, 
      message, 
      type: 'success', 
      autoClose: true, 
      primaryText: t('common.great') || 'Great',
      ...options 
    });
  }, [showFeedback, t]);

  const showError = useCallback((title: string, message?: string, options?: Partial<FeedbackOptions>) => {
    showFeedback({ 
      title, 
      message, 
      type: 'error', 
      primaryText: t('common.understood') || 'Understood',
      ...options 
    });
  }, [showFeedback, t]);

  const showWarning = useCallback((title: string, message?: string, options?: Partial<FeedbackOptions>) => {
    showFeedback({ 
      title, 
      message, 
      type: 'warning',
      ...options 
    });
  }, [showFeedback]);

  const showInfo = useCallback((title: string, message?: string, options?: Partial<FeedbackOptions>) => {
    showFeedback({ 
      title, 
      message, 
      type: 'info',
      ...options 
    });
  }, [showFeedback]);

  const showNetworkError = useCallback((onRetry?: () => void, options?: Partial<FeedbackOptions>) => {
    showFeedback({
      title: t('errors.connection_title') || 'Connection Issue',
      message: t('errors.connection_msg') || 'We are having trouble reaching our servers. Please check your internet.',
      type: 'network',
      primaryText: t('common.try_again') || 'Try Again',
      secondaryText: t('common.cancel') || 'Cancel',
      onPrimary: onRetry,
      ...options
    });
  }, [showFeedback, t]);

  const showSubscription = useCallback((message?: string, onSubscribe?: () => void, options?: Partial<FeedbackOptions>) => {
    showFeedback({
      title: t('premium.feature_title') || 'Premium Feature',
      message: message || t('premium.feature_desc') || 'This feature requires an active subscription.',
      type: 'subscription',
      primaryText: t('common.view_plans') || 'View Plans',
      secondaryText: t('common.maybe_later') || 'Maybe Later',
      onPrimary: onSubscribe,
      ...options
    });
  }, [showFeedback, t]);

  const showLoading = useCallback((title: string, message?: string, options?: Partial<FeedbackOptions>) => {
    showFeedback({
      title,
      message,
      loading: true,
      type: 'info',
      ...options
    });
  }, [showFeedback]);

  const handlePrimary = useCallback(() => {
    if (config.onPrimary) {
      config.onPrimary();
    }
    hideFeedback();
  }, [config, hideFeedback]);

  const handleSecondary = useCallback(() => {
    if (config.onSecondary) {
      config.onSecondary();
    }
    hideFeedback();
  }, [config, hideFeedback]);

  const value = useMemo(() => ({ 
    showFeedback, 
    hideFeedback,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showNetworkError,
    showSubscription,
    showLoading
  }), [
    showFeedback, 
    hideFeedback,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showNetworkError,
    showSubscription,
    showLoading
  ]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <AppFeedback
        visible={visible}
        title={config.title}
        message={config.message}
        type={config.type}
        primaryText={config.primaryText}
        secondaryText={config.secondaryText}
        onPrimary={handlePrimary}
        onSecondary={handleSecondary}
        onClose={hideFeedback}
        loading={config.loading}
        autoClose={config.autoClose}
      />
    </FeedbackContext.Provider>
  );
};

export const useFeedback = () => {
  const context = useContext(FeedbackContext);
  if (!context) throw new Error('useFeedback must be used within a FeedbackProvider');
  return context;
};

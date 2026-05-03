import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  ViewStyle,
  TextStyle
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Send, X, Trash2, Zap } from 'lucide-react-native';
import { theme } from '~/constants/theme';
import { chatApi } from '~/api/api';
import { AIQuestion } from '~/api/types';
import { useLanguage } from '~/context/LanguageContext';
import { useSubscriptionContext } from '~/context/SubscriptionContext';
import { useFeedback } from '~/context/FeedbackContext';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export default function ChatScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const {
    canUseAI,
    remainingAIRequests,
    usage,
    isSubscriptionActive,
    incrementAIUsage,
    refresh: refreshSubscription,
  } = useSubscriptionContext();
  const { showFeedback } = useFeedback();
  const aiLimit = usage?.aiUsageLimit.limit ?? 0;
  const aiUsed = usage?.aiUsageLimit.used ?? 0;
  const showCounter = aiLimit > 0; // hide the badge when unlimited or unresolved
  const isLimitReached = !canUseAI && isSubscriptionActive;
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I am your Apex AI assistant. How can I help you with your construction project today?'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AIQuestion[]>([]);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    chatApi.getRecommendedQuestions('assistant')
      .then((r) => { if (r.questions) setSuggestions(r.questions); })
      .catch(() => {});
  }, []);

  const clearChat = useCallback(() => {
    setMessages([{ id: Date.now().toString(), role: 'assistant', content: 'Chat history cleared. How can I help you now?' }]);
  }, []);

  const handleSuggestion = useCallback(async (question: AIQuestion) => {
    const displayText = question.language.en || question.language.ar;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: displayText };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    try {
      const faqResult = await chatApi.getFAQAnswer(question.id, language);
      const answerText = (language === 'ar' ? faqResult.answer?.ar : faqResult.answer?.en) || faqResult.answer?.en || "I couldn't find an answer for that question.";
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: answerText,
      }]);
    } catch {
      // Fallback: fill input so user can send manually
      setInputText(displayText);
    } finally {
      setIsLoading(false);
    }
  }, [language]);

  const sendMessage = useCallback(async () => {
    const textToSend = inputText.trim();
    if (!textToSend || isLoading) return;

    // Client-side limit gate — fail fast before hitting the server
    if (!canUseAI) {
      showFeedback({
        title: isSubscriptionActive ? 'AI Limit Reached' : 'Subscription Required',
        message: isSubscriptionActive
          ? `You have used all ${aiLimit} AI requests for this billing cycle. Upgrade your plan or wait for the next renewal.`
          : 'Activate a subscription to use the AI expert.',
        type: 'subscription',
        primaryText: 'View Plans',
      });
      return;
    }

    const newUserMsg: Message = { id: Date.now().toString(), role: 'user', content: textToSend };
    setInputText('');
    setMessages(prev => [...prev, newUserMsg]);
    setIsLoading(true);
    try {
      const response = await chatApi.sendMessage(textToSend);
      // Optimistically bump local AI usage so the counter updates immediately.
      incrementAIUsage();
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message || "I'm sorry, I couldn't process that request.",
      }]);
    } catch (err: any) {
      // Server enforced the cap (LIMIT_REACHED / 403) — sync local usage from server
      // and surface a precise message instead of the generic connection error.
      const code = err?.code || err?.data?.error?.code;
      const status = err?.status;
      if (code === 'LIMIT_REACHED' || status === 403) {
        refreshSubscription();
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: `You've reached your AI request limit (${aiLimit}). Upgrade your plan to keep chatting.`,
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: "Sorry, I'm having trouble connecting to the expert brain right now. Please try again later."
        }]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [inputText, isLoading, canUseAI, isSubscriptionActive, aiLimit, incrementAIUsage, refreshSubscription, showFeedback]);

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    const isArabic = /[\u0600-\u06FF]/.test(item.content);

    return (
      <View style={[
        styles.messageContainer, 
        isUser ? styles.userMessageContainer : styles.assistantMessageContainer
      ]}>
        <View style={[
          styles.messageBubble, 
          isUser ? styles.userBubble : styles.assistantBubble,
        ]}>
          <Text style={[
            styles.messageText, 
            isUser ? styles.userText : styles.assistantText,
            isArabic ? styles.textRight : styles.textLeft
          ]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar barStyle="dark-content" />

      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsContent}>
              {suggestions.map((q) => (
                <TouchableOpacity 
                  key={q.id} 
                  style={styles.suggestionChip}
                  onPress={() => handleSuggestion(q)}
                >
                  <Text style={styles.suggestionText}>{q.language.en || q.language.ar}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={isLoading ? (
            <View style={styles.assistantMessageContainer}>
              <View style={[styles.messageBubble, styles.assistantBubble, styles.loadingBubble]}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </View>
            </View>
          ) : null}
        />

        <View style={styles.bottomSection}>
          {showCounter && (
            <View style={[styles.usageBar, isLimitReached && styles.usageBarBlocked]}>
              <Zap size={14} color={isLimitReached ? theme.colors.error : theme.colors.primary} />
              <Text style={[styles.usageText, isLimitReached && styles.usageTextBlocked]}>
                {isLimitReached
                  ? `AI limit reached — ${aiUsed}/${aiLimit} used`
                  : `${remainingAIRequests} of ${aiLimit} AI requests remaining`}
              </Text>
            </View>
          )}
          <View style={styles.inputWrapper}>
             <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder={isLimitReached ? 'AI limit reached for this cycle…' : 'Ask anything about construction...'}
              placeholderTextColor={theme.colors.textMuted}
              multiline
              maxLength={1000}
              editable={!isLimitReached}
            />
             <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!inputText.trim() || isLimitReached) && styles.sendButtonDisabled,
                ]}
                onPress={sendMessage}
                disabled={!inputText.trim() || isLoading || isLimitReached}
             >
                <Send size={20} color={(!inputText.trim() || isLimitReached) ? theme.colors.textMuted : theme.colors.white} />
             </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme.colors.background 
  } as ViewStyle,
  keyboardView: { 
    flex: 1 
  } as ViewStyle,
  suggestionsContainer: { 
    padding: theme.spacing.md, 
    borderBottomWidth: 1, 
    borderBottomColor: theme.colors.divider,
    backgroundColor: theme.colors.white,
  } as ViewStyle,
  suggestionChip: { 
    backgroundColor: theme.colors.white, 
    borderWidth: 1, 
    borderColor: theme.colors.divider, 
    paddingVertical: 10, 
    paddingHorizontal: 16, 
    borderRadius: 20,
    ...theme.shadows.xs,
  } as ViewStyle,
  suggestionText: { 
    ...theme.typography.small,
    color: theme.colors.text, 
    fontWeight: '700' 
  } as TextStyle,
  chatContent: { 
    paddingHorizontal: theme.spacing.lg, 
    paddingVertical: theme.spacing.xl 
  } as ViewStyle,
  messageContainer: { 
    width: '100%', 
    marginVertical: 4 
  } as ViewStyle,
  userMessageContainer: { 
    alignItems: 'flex-end' 
  } as ViewStyle,
  assistantMessageContainer: { 
    alignItems: 'flex-start' 
  } as ViewStyle,
  messageBubble: { 
    maxWidth: '85%', 
    padding: 14, 
    borderRadius: 18, 
  } as ViewStyle,
  userBubble: { 
    backgroundColor: theme.colors.primary, 
    borderBottomRightRadius: 2,
    ...theme.shadows.xs,
  } as ViewStyle,
  assistantBubble: { 
    backgroundColor: theme.colors.white, 
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    ...theme.shadows.xs,
  } as ViewStyle,
  messageText: { 
    ...theme.typography.body,
    lineHeight: 22, 
  } as TextStyle,
  userText: { 
    color: theme.colors.white 
  } as TextStyle,
  assistantText: { 
    color: theme.colors.text 
  } as TextStyle,
  loadingBubble: { 
    paddingVertical: 10, 
    paddingHorizontal: 16 
  } as ViewStyle,
  bottomSection: { 
    backgroundColor: theme.colors.white, 
    paddingHorizontal: theme.spacing.lg, 
    paddingVertical: theme.spacing.md, 
    borderTopWidth: 1, 
    borderTopColor: theme.colors.divider,
    paddingBottom: Platform.OS === 'ios' ? 30 : 12,
  } as ViewStyle,
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: theme.spacing.sm 
  } as ViewStyle,
  input: { 
    flex: 1, 
    backgroundColor: theme.colors.surface, 
    borderRadius: 24, 
    paddingHorizontal: 20, 
    paddingVertical: 12, 
    ...theme.typography.body,
    color: theme.colors.text, 
    maxHeight: 120 
  } as TextStyle,
  sendButton: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    backgroundColor: theme.colors.primary, 
    justifyContent: 'center', 
    alignItems: 'center', 
    ...theme.shadows.sm,
  } as ViewStyle,
  sendButtonDisabled: { 
    backgroundColor: theme.colors.surface 
  } as ViewStyle,
  usageBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 8,
    borderRadius: 999,
    backgroundColor: theme.colors.surface,
    alignSelf: 'flex-start',
  } as ViewStyle,
  usageBarBlocked: {
    backgroundColor: '#FEE2E2',
  } as ViewStyle,
  usageText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontWeight: '700',
  } as TextStyle,
  usageTextBlocked: {
    color: theme.colors.error,
  } as TextStyle,
  textRight: { textAlign: 'right' } as TextStyle,
  textLeft: { textAlign: 'left' } as TextStyle,
  suggestionsContent: { gap: 8 } as ViewStyle
});


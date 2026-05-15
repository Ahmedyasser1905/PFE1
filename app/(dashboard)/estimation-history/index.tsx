import React, { useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { FileText, TrendingUp } from 'lucide-react-native';
import { theme } from '~/constants/theme';
import { useEstimationHistory } from '~/hooks/useEstimationHistory';
import { CalculationCard, CalculationItem } from '~/components/features/calculations/CalculationCard';
import { EmptyState } from '~/components/ui/EmptyState';
import { estimationApi } from '~/api/api';
import { Skeleton } from '~/components/ui/Skeleton';
import { useFeedback } from '~/context/FeedbackContext';
import { useLanguage } from '~/context/LanguageContext';

export default function EstimationHistoryScreen() {
   const router = useRouter();
   const { projectId, isReadOnly } = useLocalSearchParams<{ projectId?: string; isReadOnly?: string }>();
   const isLocked = isReadOnly === 'true';
   const { showError } = useFeedback();
   const { t, isRTL } = useLanguage();

   const { items, loading, totalCost, reload } = useEstimationHistory({ projectId });

   const handlePress = useCallback(
      (item: CalculationItem) => {
         router.push({
            pathname: '/(dashboard)/calculation-details/[id]',
            params: {
               id: item.id || item.projectDetailsId,
               projectId: item.projectId || projectId,
               isReadOnly: isLocked ? 'true' : 'false',
            },
         });
      },
      [router, projectId, isLocked]
   );

   const handleDelete = useCallback(
      (itemId: string) => {
         estimationApi
            .deleteLeaf(itemId)
            .then(() => reload())
            .catch((err: any) => {
               showError(t('common.error'), err.message || t('history.delete_failed'));
            });
      },
      [reload, showError, t]
   );

   const renderItem = useCallback(
      ({ item }: { item: CalculationItem }) => (
         <CalculationCard
            item={item}
            onPress={handlePress}
            isReadOnly={isLocked}
            onDelete={isLocked ? undefined : handleDelete}
            showChevron={false}
         />
      ),
      [handlePress, isLocked, handleDelete]
   );

   const keyExtractor = useCallback(
      (item: CalculationItem, index: number) => item.id?.toString() || index.toString(),
      []
   );

   if (loading) {
      return (
         <View style={styles.container}>
            <View style={styles.totalCard}>
               <Skeleton width={120} height={20} style={[styles.mb8, isRTL && { alignSelf: 'flex-end' }] as any} />
               <Skeleton width={200} height={40} style={[styles.mb8, isRTL && { alignSelf: 'flex-end' }] as any} />
               <Skeleton width={100} height={16} style={[isRTL && { alignSelf: 'flex-end' }] as any} />
            </View>
            <View style={styles.listContent}>
               {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} width="100%" height={100} borderRadius={16} style={styles.mb12} />
               ))}
            </View>
         </View>
      );
   }

   return (
      <View style={styles.container}>
         <View style={styles.totalCard}>
            <View style={[styles.totalHeader, isRTL && styles.rtlRow]}>
               <TrendingUp size={18} color="rgba(255, 255, 255, 0.8)" />
               <Text style={[styles.totalLabel, isRTL && styles.rtlText]}>{t('history.total_estimated_cost') || 'TOTAL ESTIMATED COST'}</Text>
            </View>
            <View style={[styles.totalContentRow, isRTL && styles.rtlRow]}>
               <View>
                  <Text style={[styles.totalValue, isRTL && styles.rtlText]}>DZD {totalCost.toLocaleString()}</Text>
                  <Text style={[styles.totalCount, isRTL && styles.rtlText]}>
                     {t('history.across_calculations')?.replace('{count}', items.length.toString()) || `Across ${items.length} calculation${items.length !== 1 ? 's' : ''}`}
                  </Text>
               </View>
               <View style={styles.totalIconCircle}>
                  <FileText size={24} color={theme.colors.primary} />
               </View>
            </View>
         </View>

         {items.length === 0 ? (
            <EmptyState
               icon={<FileText size={48} color={theme.colors.textMuted} />}
               title={t('history.no_calculations') || "No calculations saved yet"}
               description={t('history.no_calculations_desc') || "Run a new calculation inside a project to see it here."}
            />
         ) : (
            <FlatList
               data={items}
               keyExtractor={keyExtractor}
               renderItem={renderItem}
               contentContainerStyle={styles.listContent}
               showsVerticalScrollIndicator={false}
               keyboardShouldPersistTaps="handled"
               removeClippedSubviews
               initialNumToRender={12}
               maxToRenderPerBatch={10}
               windowSize={5}
            />
         )}
      </View>
   );
}

const styles = StyleSheet.create({
   container: { flex: 1, backgroundColor: theme.colors.background } as ViewStyle,
   center: { justifyContent: 'center', alignItems: 'center' } as ViewStyle,
   loadingText: { ...theme.typography.small, color: theme.colors.textSecondary, fontWeight: '600', marginTop: theme.spacing.md } as TextStyle,
   totalCard: { margin: theme.spacing.lg, backgroundColor: theme.colors.primary, padding: theme.spacing.xl, borderRadius: theme.roundness.xxl, ...theme.shadows.md } as ViewStyle,
   totalHeader: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.md } as ViewStyle,
   totalLabel: { ...theme.typography.caption, color: 'rgba(255, 255, 255, 0.8)', fontWeight: '800', letterSpacing: 0.5 } as TextStyle,
   totalContentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' } as ViewStyle,
   totalValue: { ...theme.typography.h1, fontSize: 28, color: theme.colors.white } as TextStyle,
   totalCount: { ...theme.typography.small, color: 'rgba(255, 255, 255, 0.7)', marginTop: 2 } as TextStyle,
   totalIconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255, 255, 255, 0.2)', alignItems: 'center', justifyContent: 'center' } as ViewStyle,
   listContent: { paddingHorizontal: theme.spacing.lg, paddingBottom: 100 } as ViewStyle,
   mb8: { marginBottom: 8 } as ViewStyle,
   mb12: { marginBottom: 12 } as ViewStyle,
   rtlRow: { flexDirection: 'row-reverse' } as ViewStyle,
   rtlText: { textAlign: 'right' } as TextStyle,
});

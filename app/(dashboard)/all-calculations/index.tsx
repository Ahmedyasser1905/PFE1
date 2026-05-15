/**
 * AllCalculationsScreen — Shows all leaf calculations for a specific project.
 *
 * Data flow: API → useEstimationHistory(projectId) → CalculationCard → UI
 *
 * Receives `projectId` as a search param and fetches that project's
 * estimation data from the backend.
 *
 * All data is API-driven. No hardcoded or mock data.
 */
import React, { useCallback } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, Text, ViewStyle, TextStyle } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LayoutGrid } from 'lucide-react-native';
import { useEstimationHistory } from '~/hooks/useEstimationHistory';
import { CalculationCard, CalculationItem } from '~/components/features/calculations/CalculationCard';
import { EmptyState } from '~/components/ui/EmptyState';
import { theme } from '~/constants/theme';
import { Skeleton } from '~/components/ui/Skeleton';
import { useLanguage } from '~/context/LanguageContext';

export default function AllCalculationsScreen() {
   const router = useRouter();
   const { projectId } = useLocalSearchParams<{ projectId?: string }>();
   const { t } = useLanguage();

   // Fetch remote calculations for the project (or all projects if no projectId)
   const { items, loading } = useEstimationHistory({ projectId });

   const handlePress = useCallback(
      (item: CalculationItem) => {
         router.push({
            pathname: '/(dashboard)/calculation-details/[id]',
            params: {
               id: item.id || item.projectDetailsId,
               projectId: item.projectId || projectId,
            },
         });
      },
      [router, projectId]
   );

   const renderItem = useCallback(
      ({ item }: { item: CalculationItem }) => (
         <CalculationCard item={item} onPress={handlePress} isReadOnly showChevron />
      ),
      [handlePress]
   );

   const keyExtractor = useCallback(
      (item: CalculationItem, index: number) => item.id?.toString() || index.toString(),
      []
   );

   if (loading) {
      return (
         <View style={styles.container}>
            <View style={styles.listContent}>
               {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} width="100%" height={100} borderRadius={16} style={{ marginBottom: 12 }} />
               ))}
            </View>
         </View>
      );
   }

   if (items.length === 0) {
      return (
         <View style={styles.container}>
            <EmptyState
               icon={<LayoutGrid size={48} color={theme.colors.textMuted} />}
               title={t('calculations.no_calculations_title', { defaultValue: 'No calculations found' })}
               description={t('calculations.no_calculations_desc', { defaultValue: 'Calculations you save to this project will appear here.' })}
            />
         </View>
      );
   }

   return (
      <View style={styles.container}>
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
      </View>
   );
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
      backgroundColor: theme.colors.background
   } as ViewStyle,
   center: {
      justifyContent: 'center',
      alignItems: 'center'
   } as ViewStyle,
   loadingText: {
      ...theme.typography.small,
      color: theme.colors.textSecondary,
      fontWeight: '600',
      marginTop: theme.spacing.md,
   } as TextStyle,
   listContent: {
      padding: theme.spacing.lg,
      paddingBottom: 100
   } as ViewStyle,
});

/**
 * CalculationDetailsScreen — Shows full breakdown of a single leaf calculation.
 *
 * Data flow:
 *  1. Try local storage (offline calculations)
 *  2. If not found locally → fetch from API via project estimation
 *  3. Resolve field UUIDs → human-readable labels via category leaf endpoint
 *  4. Display: inputs (labeled), results, material lines, total cost
 *
 * ALL data is API-driven. No hardcoded values.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Trash2, Calculator, Target, Component, Calendar, Package, Layers } from 'lucide-react-native';
import { theme } from '~/constants/theme';
import { ScreenShell } from '~/components/common/ScreenShell';
import { getLocalCalculationById, LocalCalculation } from '~/hooks/useLocalCalculations';
import { storage } from '~/utils/storage';
import { STORAGE_KEYS } from '~/constants/config';
import { estimationApi } from '~/api/api';
import type { MaterialLine } from '~/api/types';
import { useLanguage } from '~/context/LanguageContext';
import { Skeleton } from '~/components/ui/Skeleton';
import { EmptyState } from '~/components/ui/EmptyState';
import { ErrorScreen } from '~/components/ui/ErrorScreen';
import { useFeedback } from '~/context/FeedbackContext';

// Resolved input with human-readable label (instead of raw UUID key)
interface ResolvedInput {
   label: string;
   value: number;
   unitSymbol: string;
}

export default function CalculationDetailsScreen() {
   const router = useRouter();
   const { id, projectId, isReadOnly } = useLocalSearchParams<{ id: string; projectId?: string; isReadOnly?: string }>();
   const { language, t, isRTL } = useLanguage();
   const isLocked = isReadOnly === 'true';

   const [calc, setCalc] = useState<LocalCalculation | null>(null);
   const [resolvedInputs, setResolvedInputs] = useState<ResolvedInput[]>([]);
   const [loadingLabels, setLoadingLabels] = useState(false);
   const [loading, setLoading] = useState(true);
   const { showFeedback } = useFeedback();

   // ── Load calculation data ──────────────────────────────────────────────────
   useEffect(() => {
      if (!id) return;

      const loadData = async () => {
         setLoading(true);

         // 1. Try local storage first
         const localCalc = await getLocalCalculationById(id);
         if (localCalc) {
            setCalc(localCalc);
            setLoading(false);
            return;
         }

         // 2. Fallback: fetch from API via project estimation
         if (projectId) {
            try {
               const report = await estimationApi.getProjectEstimation(projectId);
               const remoteLeaf = report?.leafCalculations?.find(l => l.projectDetailsId === id);
               if (remoteLeaf) {
                  setCalc({
                     id: remoteLeaf.projectDetailsId,
                     projectId: projectId,
                     category: remoteLeaf.categoryName,
                     categoryId: remoteLeaf.categoryId,
                     subCategory: remoteLeaf.configName || undefined,
                     type: remoteLeaf.formulaName,
                     selectedFormulaId: remoteLeaf.selectedFormulaId,
                     inputs: remoteLeaf.fieldValues || {},
                     results: remoteLeaf.results || {},
                     result: remoteLeaf.leafTotal,
                     createdAt: remoteLeaf.createdAt,
                     isLocal: false,
                     materialLines: remoteLeaf.materialLines,
                     serviceLines: remoteLeaf.serviceLines,
                  });
               }
            } catch (err) {
               console.warn('Failed to fetch remote calculation details:', err);
            }
         }

         setLoading(false);
      };

      loadData();
   }, [id, projectId]);

   // ── Resolve field UUID keys → human-readable labels ────────────────────────
   useEffect(() => {
      if (!calc || !calc.inputs || Object.keys(calc.inputs).length === 0) {
         setResolvedInputs([]);
         return;
      }

      // If the keys already look like labels (not UUIDs), use them directly
      const firstKey = Object.keys(calc.inputs)[0];
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(firstKey);

      if (!isUUID) {
         // Keys are already human-readable (local calculations)
         setResolvedInputs(
            Object.entries(calc.inputs).map(([key, val]) => ({
               label: key.replace(/_/g, ' '),
               value: Number(val),
               unitSymbol: '',
            }))
         );
         return;
      }

      // Keys are UUIDs → fetch category leaf to resolve labels
      if (!calc.categoryId) {
         // No categoryId available — show keys as-is
         setResolvedInputs(
            Object.entries(calc.inputs).map(([key, val]) => ({
               label: key.substring(0, 8) + '…',
               value: Number(val),
               unitSymbol: '',
            }))
         );
         return;
      }

      setLoadingLabels(true);
      estimationApi
         .getCategoryLeaf(calc.categoryId)
         .then((leafDetail) => {
            // Find the matching formula to get field definitions
            const formula = calc.selectedFormulaId
               ? leafDetail.formulas.find((f) => f.formulaId === calc.selectedFormulaId)
               : leafDetail.formulas[0];

            if (!formula) {
               // Formula not found — show raw keys
               setResolvedInputs(
                  Object.entries(calc.inputs).map(([key, val]) => ({
                     label: key.substring(0, 8) + '…',
                     value: Number(val),
                     unitSymbol: '',
                  }))
               );
               return;
            }

            // Build field_id → { label, unitSymbol } lookup
            const fieldMap = new Map<string, { label: string; unitSymbol: string }>();
            formula.fields.forEach((f) => {
               fieldMap.set(f.fieldId, { label: f.label, unitSymbol: f.unitSymbol });
            });

            // Resolve each input
            const resolved: ResolvedInput[] = Object.entries(calc.inputs).map(([fieldId, val]) => {
               const meta = fieldMap.get(fieldId);
               return {
                  label: meta?.label || fieldId.substring(0, 8) + '…',
                  value: Number(val),
                  unitSymbol: meta?.unitSymbol || '',
               };
            });

            setResolvedInputs(resolved);
         })
         .catch((err) => {
            console.warn('Failed to resolve field labels:', err);
            // Fallback: show raw keys
            setResolvedInputs(
               Object.entries(calc.inputs).map(([key, val]) => ({
                  label: key.substring(0, 8) + '…',
                  value: Number(val),
                  unitSymbol: '',
               }))
            );
         })
         .finally(() => setLoadingLabels(false));
   }, [calc]);

   // ── Delete handler ─────────────────────────────────────────────────────────
   const confirmDelete = useCallback(() => {
      if (!calc) return;

      showFeedback({
         title: t('calc_details.delete_title') || 'Delete Calculation',
         message: t('calc_details.delete_msg') || 'Remove this record?',
         type: 'warning',
         primaryText: t('common.delete') || 'Delete',
         secondaryText: t('common.cancel') || 'Cancel',
         onPrimary: async () => {
            if (calc.isLocal) {
               // Delete from local storage
               const raw = await storage.getItem(STORAGE_KEYS.CALCULATIONS);
               if (raw) {
                  const list = JSON.parse(raw);
                  await storage.setItem(
                     STORAGE_KEYS.CALCULATIONS,
                     JSON.stringify(list.filter((x: any) => x.id !== id))
                  );
               }
            } else if (id) {
               // Delete from backend
               try {
                  await estimationApi.deleteLeaf(id);
               } catch (err: any) {
                  showFeedback({
                     title: t('common.error') || 'Error',
                     message: JSON.stringify(err?.response?.data || err?.message || t('calc_details.delete_failed') || 'Failed to delete from server.'),
                     type: 'error',
                  });
                  return;
               }
            }
            router.back();
         },
      });
   }, [id, calc, router, showFeedback, t]);

   const title = calc ? (calc.type || calc.subCategory || calc.category || t('calc_details.calculation') || 'Calculation') : '';
   const materialLines: MaterialLine[] = calc?.materialLines || [];
   const serviceLines: any[] = calc?.serviceLines || [];

   // ── Loading state ──────────────────────────────────────────────────────────
   if (loading) {
      return (
         <ScreenShell showHeader={false}>
            <View style={styles.content}>
               <Skeleton width="100%" height={180} borderRadius={24} />
               <Skeleton width="100%" height={200} borderRadius={20} />
               <Skeleton width="100%" height={150} borderRadius={20} />
            </View>
         </ScreenShell>
      );
   }

   return (
      <ScreenShell
         showHeader={false}
         rightAction={
            !isLocked && calc ? (
               <TouchableOpacity style={styles.deleteBtn} onPress={confirmDelete}>
                  <Trash2 size={20} color="#EF4444" />
               </TouchableOpacity>
            ) : undefined
         }
      >
         {!calc ? (
            <EmptyState
               icon={<Calculator size={48} color={theme.colors.textMuted} />}
               title={t('calc_details.not_found_title') || "Calculation Not Found"}
               description={t('calc_details.not_found_desc') || "This calculation may have been removed or is no longer available."}
               actionLabel={t('common.go_back') || "Go Back"}
               onAction={() => router.back()}
            />
         ) : (
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
               {/* ── Title Card ── */}
               <View style={styles.titleCard}>
                  <View style={styles.iconCircle}>
                     <Calculator size={32} color={theme.colors.primary} />
                  </View>
                  <Text style={styles.titleName}>
                     {title.replace(/_/g, ' ').toUpperCase()}
                  </Text>
                  {!!calc.category && calc.category !== title && (
                     <Text style={styles.categoryBadge}>{calc.category}</Text>
                  )}
                  <View style={styles.dateRow}>
                     <Calendar size={14} color={theme.colors.textMuted} />
                     <Text style={styles.titleDate}>
                        {new Date(calc.createdAt).toLocaleString()}
                     </Text>
                  </View>
               </View>

               {/* ── Input Parameters ── */}
               <View style={styles.section}>
                  <View style={[styles.sectionHeader, isRTL && { flexDirection: 'row-reverse' }]}>
                     <Component size={18} color={theme.colors.textSecondary} />
                     <Text style={[styles.sectionTitle, isRTL && { textAlign: 'right' }]}>{t('calc_details.input_parameters') || 'Input Parameters'}</Text>
                  </View>
                  <View style={styles.card}>
                     {loadingLabels ? (
                        <View style={styles.labelLoadingRow}>
                           <Skeleton width="100%" height={20} style={{ marginBottom: 10 }} />
                           <Skeleton width="100%" height={20} style={{ marginBottom: 10 }} />
                           <Skeleton width="100%" height={20} />
                        </View>
                     ) : resolvedInputs.length > 0 ? (
                        resolvedInputs.map((input, idx) => (
                           <View style={styles.row} key={idx}>
                              <Text style={styles.rowLabel}>{input.label.toUpperCase()}</Text>
                              <Text style={styles.rowValue}>
                                 {input.value}{input.unitSymbol ? ` ${input.unitSymbol}` : ''}
                              </Text>
                           </View>
                        ))
                     ) : (
                        <Text style={styles.noDataText}>{t('calc_details.no_input_params') || 'No input parameters recorded.'}</Text>
                     )}
                  </View>
               </View>

               {/* ── Calculated Results ── */}
               <View style={styles.section}>
                  <View style={[styles.sectionHeader, isRTL && { flexDirection: 'row-reverse' }]}>
                     <Target size={18} color={theme.colors.success} />
                     <Text style={[styles.sectionTitle, isRTL && { textAlign: 'right' }]}>{t('calc_details.calculated_results') || 'Calculated Results'}</Text>
                  </View>
                  <View style={styles.card}>
                     {calc.results && Object.keys(calc.results).length > 0 ? (
                        Object.entries(calc.results).map(([key, val]) => (
                           <View style={styles.row} key={key}>
                              <Text style={styles.rowLabel}>
                                 {key.replace(/_/g, ' ').toUpperCase()}
                              </Text>
                              <Text style={styles.rowValue}>
                                 {Number(val).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                              </Text>
                           </View>
                        ))
                     ) : (
                         <View style={[styles.row, isRTL && { flexDirection: 'row-reverse' }]}>
                            <Text style={[styles.rowLabel, isRTL && { textAlign: 'right' }]}>{t('calc_details.estimated_cost') || 'ESTIMATED COST'}</Text>
                            <Text style={styles.rowValue}>
                              {Number(calc.result).toLocaleString()} DZD
                           </Text>
                        </View>
                     )}
                  </View>
               </View>

               {/* ── Material Breakdown (from API) ── */}
               {materialLines.length > 0 && (
                  <View style={styles.section}>
                     <View style={styles.sectionHeader}>
                        <Package size={18} color={theme.colors.warning} />
                        <Text style={[styles.sectionTitle, isRTL && { textAlign: 'right' }]}>{t('history.material_breakdown', { defaultValue: 'Material Breakdown' })}</Text>
                     </View>
                     <View style={styles.card}>
                        {materialLines.map((ml, idx) => {
                           const displayName = language === 'ar'
                              ? (ml.materialNameAr || ml.materialName)
                              : (ml.materialNameEn || ml.materialName);
                           return (
                              <View style={[styles.materialRow, isRTL && { flexDirection: 'row-reverse' }]} key={ml.materialId || idx}>
                                 <View style={[styles.materialInfo, isRTL && { alignItems: 'flex-end' }]}>
                                    <View style={styles.materialNameRow}>
                                       <Text style={styles.materialName}>{displayName}</Text>
                                       <View style={[
                                          styles.materialTypeBadge,
                                          ml.materialType === 'PRIMARY' ? styles.primaryBadge : styles.accessoryBadge
                                       ]}>
                                          <Text style={[
                                             styles.materialTypeText,
                                             ml.materialType === 'PRIMARY' ? styles.primaryText : styles.accessoryText
                                           ]}>
                                              {ml.materialType === 'PRIMARY' ? (t('calc_details.primary_badge') || 'PRIMARY') : (t('calc_details.accessory_badge') || 'ACCESSORY')}
                                           </Text>
                                       </View>
                                    </View>
                                    <Text style={styles.materialDetail}>
                                       {ml.quantityWithWaste.toFixed(2)} {ml.unitSymbol || 'unit'} × {ml.unitPriceSnapshot.toLocaleString()} DZD
                                    </Text>
                                     {ml.appliedWaste > 0 && (
                                        <Text style={styles.wasteText}>
                                           {t('calc_details.waste') || 'Waste'}: {(ml.appliedWaste * 100).toFixed(1)}% ({ml.quantity.toFixed(2)} → {ml.quantityWithWaste.toFixed(2)})
                                        </Text>
                                     )}
                                 </View>
                                 <Text style={styles.materialCost}>
                                    {ml.subTotal.toLocaleString()} DZD
                                 </Text>
                              </View>
                           )
                        })}
                     </View>
                  </View>
               )}

               {/* ── Services Breakdown (from API) ── */}
               {serviceLines.length > 0 && (
                  <View style={styles.section}>
                     <View style={styles.sectionHeader}>
                        <Layers size={18} color={theme.colors.info} />
                        <Text style={[styles.sectionTitle, isRTL && { textAlign: 'right' }]}>{t('history.services_breakdown', { defaultValue: 'Services Breakdown' })}</Text>
                     </View>
                     <View style={styles.card}>
                        {serviceLines.map((sl, idx) => {
                           const displayName = language === 'ar'
                              ? (sl.serviceNameAr || sl.serviceName)
                              : (sl.serviceNameEn || sl.serviceName);
                           return (
                              <View style={[styles.materialRow, isRTL && { flexDirection: 'row-reverse' }]} key={sl.serviceId || idx}>
                                 <View style={[styles.materialInfo, isRTL && { alignItems: 'flex-end' }]}>
                                    <View style={styles.materialNameRow}>
                                       <Text style={styles.materialName}>{displayName}</Text>
                                        <View style={[styles.materialTypeBadge, { backgroundColor: theme.colors.infoLight }]}>
                                           <Text style={[styles.materialTypeText, { color: theme.colors.info }]}>
                                              {t('calc_details.service_badge') || 'SERVICE'}
                                           </Text>
                                        </View>
                                    </View>
                                    <Text style={styles.materialDetail}>
                                       {sl.quantity.toFixed(2)} {sl.unitSymbol || 'unit'} × {sl.unitPriceSnapshot.toLocaleString()} DZD
                                    </Text>
                                 </View>
                                 <Text style={styles.materialCost}>
                                    {sl.subTotal.toLocaleString()} DZD
                                 </Text>
                              </View>
                           )
                        })}
                     </View>
                  </View>
               )}

               {/* ── Summary Highlight ── */}
               <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>{t('history.final_estimation', { defaultValue: 'Final Estimation' })}</Text>
                  <Text style={styles.summaryValue}>DZD {Number(calc.result).toLocaleString()}</Text>
                   {(materialLines.length > 0 || serviceLines.length > 0) && (
                      <Text style={styles.summaryMeta}>
                         {materialLines.length > 0 ? t('calc_details.materials_count', { count: materialLines.length, defaultValue: `${materialLines.length} material(s)` }) : ''}
                         {materialLines.length > 0 && serviceLines.length > 0 ? ' · ' : ''}
                         {serviceLines.length > 0 ? t('calc_details.services_count', { count: serviceLines.length, defaultValue: `${serviceLines.length} service(s)` }) : ''}
                      </Text>
                   )}
               </View>
            </ScrollView>
         )}
      </ScreenShell>
   );
}

const styles = StyleSheet.create({
   centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 } as ViewStyle,
   loadingText: {
      ...theme.typography.body,
      textAlign: 'center',
      marginTop: 12,
      color: theme.colors.textSecondary,
   } as TextStyle,
   deleteBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.errorLight,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.errorLight,
   } as ViewStyle,
   content: {
      padding: theme.spacing.lg,
      gap: theme.spacing.xl,
      paddingBottom: 40,
   } as ViewStyle,
   titleCard: {
      alignItems: 'center',
      backgroundColor: theme.colors.white,
      padding: theme.spacing.xl,
      borderRadius: theme.roundness.xxl,
      borderWidth: 1,
      borderColor: theme.colors.divider,
      ...theme.shadows.sm,
   } as ViewStyle,
   iconCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: theme.colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.md,
   } as ViewStyle,
   titleName: {
      ...theme.typography.h2,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
      textAlign: 'center',
   } as TextStyle,
   categoryBadge: {
      ...theme.typography.caption,
      fontWeight: '800',
      color: theme.colors.primary,
      backgroundColor: theme.colors.primaryLight,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: theme.roundness.sm,
      marginBottom: theme.spacing.md,
      overflow: 'hidden',
   } as TextStyle,
   dateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6
   } as ViewStyle,
   titleDate: {
      ...theme.typography.caption,
      color: theme.colors.textMuted,
      fontWeight: '700',
   } as TextStyle,

   section: { gap: theme.spacing.md } as ViewStyle,
   sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginLeft: 4
   } as ViewStyle,
   sectionTitle: {
      ...theme.typography.caption,
      fontWeight: '900',
      color: theme.colors.textSecondary,
      letterSpacing: 1,
      textTransform: 'uppercase',
   } as TextStyle,

   card: {
      backgroundColor: theme.colors.white,
      borderRadius: theme.roundness.xl,
      padding: theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.divider,
      ...theme.shadows.xs,
      overflow: 'hidden',
   } as ViewStyle,
   row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
   } as ViewStyle,
   rowLabel: {
      ...theme.typography.small,
      color: theme.colors.textSecondary,
      fontWeight: '700',
      flex: 1,
   } as TextStyle,
   rowValue: {
      ...theme.typography.bodyBold,
      color: theme.colors.text,
   } as TextStyle,
   noDataText: {
      ...theme.typography.small,
      color: theme.colors.textMuted,
      textAlign: 'center',
      paddingVertical: theme.spacing.md,
   } as TextStyle,

   labelLoadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: theme.spacing.md,
      justifyContent: 'center'
   } as ViewStyle,

   // Material lines
   materialRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingVertical: theme.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
   } as ViewStyle,
   materialInfo: {
      flex: 1,
      marginRight: theme.spacing.md
   } as ViewStyle,
   materialNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginBottom: 4
   } as ViewStyle,
   materialName: {
      ...theme.typography.bodyBold,
      color: theme.colors.text,
   } as TextStyle,
   materialTypeBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: theme.roundness.sm
   } as ViewStyle,
   primaryBadge: {
      backgroundColor: theme.colors.primaryLight
   } as ViewStyle,
   accessoryBadge: {
      backgroundColor: theme.colors.warningLight
   } as ViewStyle,
   materialTypeText: {
      ...theme.typography.caption,
      fontSize: 9,
      fontWeight: '900',
      letterSpacing: 0.5
   } as TextStyle,
   primaryText: {
      color: theme.colors.primary
   } as TextStyle,
   accessoryText: {
      color: theme.colors.warning
   } as TextStyle,
   materialDetail: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
      fontWeight: '700',
   } as TextStyle,
   wasteText: {
      ...theme.typography.small,
      fontSize: 10,
      color: theme.colors.textMuted,
      fontWeight: '600',
      marginTop: 2
   } as TextStyle,
   materialCost: {
      ...theme.typography.bodyBold,
      color: theme.colors.text,
   } as TextStyle,

   // Summary
   summaryCard: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.roundness.xxl,
      padding: theme.spacing.xl,
      alignItems: 'center',
      justifyContent: 'center',
      ...theme.shadows.md,
   } as ViewStyle,
   summaryLabel: {
      ...theme.typography.bodyMedium,
      color: 'rgba(255,255,255,0.8)',
      marginBottom: 4
   } as TextStyle,
   summaryValue: {
      ...theme.typography.h1,
      color: theme.colors.white,
      fontSize: 32,
   } as TextStyle,
   summaryMeta: {
      ...theme.typography.caption,
      color: 'rgba(255,255,255,0.6)',
      fontWeight: '700',
      marginTop: 4
   } as TextStyle,
});

/**
 * ProjectDetailScreen — UI layer only (thin screen).
 *
 * All business logic lives in:
 *  - hooks/useProjectDetail.ts  (fetch, mutations, derived data)
 *  - hooks/useLocalCalculations.ts  (offline storage)
 *
 * Completed projects are fully read-only:
 *  - No "Start Calculation" section
 *  - No "Recent Activity" section
 *  - Only shows Restore/Delete buttons
 *  - Lock banner displayed prominently
 */
import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Image,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import {
  HardHat,
  Paintbrush,
  DoorOpen,
  LayoutGrid,
  Grid3X3,
  BarChart3,
  TrendingUp,
  DollarSign,
  Clock,
  AlertCircle,
  ChevronRight,
  Lock,
  FileDown,
  Trash2,
} from 'lucide-react-native';
import { theme } from '~/constants/theme';
import { useProjectDetail } from '~/hooks/useProjectDetail';
import { useLocalCalculations } from '~/hooks/useLocalCalculations';
import { CalculationCard, CalculationItem } from '~/components/features/calculations/CalculationCard';
import { estimationApi } from '~/api/api';
import { ErrorScreen } from '~/components/ui/ErrorScreen';
import { EmptyState } from '~/components/ui/EmptyState';
import { useFeedback } from '~/context/FeedbackContext';
import { resolveImageUrl, FALLBACK_IMAGE } from '~/utils/imageResolver';

// ─── Icon helpers ─────────────────────────────────────────────────────────────
const getCategoryIcon = (name: string) => {
  const low = (name || '').toLowerCase();
  if (low.includes('grand') || low.includes('struct') || low.includes('gros')) return HardHat;
  if (low.includes('finit') || low.includes('paint') || low.includes('decor')) return Paintbrush;
  if (low.includes('door') || low.includes('window') || low.includes('porte')) return DoorOpen;
  return LayoutGrid;
};

const getCategoryColor = (name: string): [string, string] => {
  const low = (name || '').toLowerCase();
  if (low.includes('grand') || low.includes('struct') || low.includes('gros')) return ['#2563EB', '#EFF6FF'];
  if (low.includes('finit') || low.includes('paint')) return ['#16A34A', '#F0FDF4'];
  if (low.includes('door') || low.includes('window') || low.includes('porte')) return ['#6366F1', '#F5F3FF'];
  return ['#0EA5E9', '#F0F9FF'];
};


// ─── Screen ───────────────────────────────────────────────────────────────────
export default function ProjectDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Local offline calculations
  const { calculations: localCalculations } = useLocalCalculations({ projectId: id });

  // All business logic
  const {
    project,
    loading,
    refreshing,
    error,
    isCompleted,
    categoryGroups,
    rootCategories,
    recentCalculations,
    calculatedTotal,
    projectIdShort,
    fetchData,
    onRefresh
  } = useProjectDetail(id as string, localCalculations);

  const { showInfo, showSuccess, showWarning } = useFeedback();

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  // ─── Export PDF handler ──────────────────────────────────────────────────────
  const handleExportPDF = useCallback(async () => {
    if (!id) return;
    showInfo('Export Report', 'Generate and send a PDF report for this project?', {
      primaryText: 'Export',
      onPrimary: async () => {
        try {
          const result = await estimationApi.exportProject(id);
          showSuccess('Success', result?.message || 'PDF report has been sent to your email.');
        } catch (err: any) {
          // Error already handled by API interceptor, but we can override or add context if needed
        }
      },
    });
  }, [id, showInfo, showSuccess]);

  // ─── Delete leaf handler ────────────────────────────────────────────────────
  const handleDeleteLeaf = useCallback((projectDetailsId: string, categoryName: string) => {
    if (isCompleted) return;
    showWarning('Delete Calculation', `Remove the "${categoryName}" calculation from this project?`, {
      primaryText: 'Delete',
      onPrimary: async () => {
        try {
          await estimationApi.deleteLeaf(projectDetailsId);
          fetchData(); // Refresh to reflect changes
          showSuccess('Deleted', 'Calculation removed successfully.');
        } catch (err: any) {
          // Error already handled by API interceptor
        }
      },
    });
  }, [isCompleted, fetchData, showWarning, showSuccess]);

  // ─── Loading state ─────────────────────────────────────────────────────────
  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading project...</Text>
      </View>
    );
  }

  // ─── Error state ───────────────────────────────────────────────────────────
  if (error || !project) {
    return (
      <ErrorScreen
        type={error?.includes('Network') ? 'network' : 'unknown'}
        message={error || 'Project not found'}
        onRetry={fetchData}
      />
    );
  }

  const totalCost = calculatedTotal.toLocaleString();
  const leafCount = categoryGroups.reduce((s, g) => s + g.count, 0);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        <View style={styles.content}>
          {/* ── Title Section ── */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>{project.name}</Text>
            <View style={styles.metaRow}>
              <View style={[styles.statusBadge, isCompleted ? styles.statusCompleted : styles.statusActive]}>
                <Text style={styles.statusText}>{isCompleted ? 'COMPLETED' : 'ACTIVE'}</Text>
              </View>
              <Text style={styles.metaText}>📋 {projectIdShort}</Text>
            </View>
          </View>

          {/* ── Project Image ── */}
          {project.imageUrl && (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: resolveImageUrl(project.imageUrl) }}
                style={styles.heroImage}
                resizeMode="cover"
                defaultSource={{ uri: FALLBACK_IMAGE }}
                onError={() => {
                  if (__DEV__) console.log('[ProjectDetail] image load failed for', project.projectId, project.imageUrl);
                }}
              />
            </View>
          )}

          {/* ── Lock Banner (read-only guard) ── */}
          {isCompleted && (
            <View style={styles.lockBanner}>
              <Lock size={16} color={theme.colors.error} />
              <Text style={styles.lockBannerText}>
                This project is completed and locked — no modifications allowed.
              </Text>
            </View>
          )}

          {/* ── Budget Card ── */}
          <View style={styles.budgetCard}>
            <View style={styles.budgetHeader}>
              <TrendingUp size={18} color="rgba(255, 255, 255, 0.8)" />
              <Text style={styles.budgetTitle}>BUDGET OVERVIEW</Text>
            </View>
            <View style={styles.budgetContent}>
              <View>
                <Text style={styles.budgetMainValue}>DZD {totalCost}</Text>
                <Text style={styles.budgetSubText}>Cumulative Project Cost</Text>
              </View>
              <View style={styles.budgetIconCircle}>
                <DollarSign size={24} color={theme.colors.primary} />
              </View>
            </View>
          </View>

          {/* ── Description ── */}
          {!!project.description && (
            <View style={styles.overviewCard}>
              <Text style={styles.overviewLabel}>PROJECT OVERVIEW</Text>
              <Text style={styles.overviewText}>{project.description}</Text>
            </View>
          )}

          {/* ── Stats ── */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View>
                <Text style={styles.statLabel}>Total Calculations</Text>
                <Text style={styles.statValue}>{leafCount}</Text>
              </View>
              <Grid3X3 size={22} color={theme.colors.primary} />
            </View>
            <View style={styles.statCard}>
              <View>
                <Text style={styles.statLabel}>Active Categories</Text>
                <Text style={styles.statValue}>{categoryGroups.length}</Text>
              </View>
              <BarChart3 size={22} color={theme.colors.primary} />
            </View>
          </View>

          {/* ── Quick Category Shortcuts (ACTIVE only) ── */}
          {!isCompleted && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Start Calculation</Text>
              </View>
              <View style={styles.mainCategoriesRow}>
                {rootCategories.map((cat) => {
                  const Icon = getCategoryIcon(cat.nameEn);
                  const [color, bg] = getCategoryColor(cat.nameEn);
                  return (
                    <Pressable
                      key={cat.categoryId}
                      style={styles.mainCatCard}
                      onPress={() =>
                        router.push({
                          pathname: '/(dashboard)/projects/[id]/category/[categoryId]',
                          params: { id, categoryId: cat.categoryId },
                        })
                      }
                    >
                      <View style={[styles.mainCatIcon, { backgroundColor: bg }]}>
                        <Icon size={24} color={color} />
                      </View>
                      <Text style={styles.mainCatText} numberOfLines={1}>{cat.nameEn}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

          {/* ── Saved Calculations (Category Groups) ── */}
          <View style={styles.sectionHeaderHistory}>
            <Text style={styles.sectionTitle}>Saved Calculations</Text>
          </View>

          {categoryGroups.length === 0 ? (
            <EmptyState
              icon={<LayoutGrid size={48} color="#94a3b8" />}
              title="No calculations yet"
              description={isCompleted ? "This project has no saved calculations." : "Select a category above to start your first estimation."}
            />
          ) : (
            categoryGroups.map((group, idx) => {
              const Icon = getCategoryIcon(group.name);
              const [iconColor, iconBg] = getCategoryColor(group.name);
              const tags = Array.from(
                new Set(group.leaves.flatMap((l) => [l.formulaName, l.configName].filter(Boolean)))
              ).slice(0, 2) as string[];

              return (
                <Pressable
                  key={`cat-${idx}`}
                  style={styles.categoryCard}
                  onPress={() =>
                    router.push({
                      pathname: '/(dashboard)/estimation-history/',
                      params: { projectId: id, isReadOnly: isCompleted ? 'true' : 'false' },
                    })
                  }
                >
                  <View style={styles.categoryCardTop}>
                    <View style={[styles.categoryIcon, { backgroundColor: iconBg }]}>
                      <Icon size={22} color={iconColor} />
                    </View>
                    <Text style={styles.categoryCalcCount}>{group.count} CALCS</Text>
                  </View>
                  <Text style={styles.categoryTitle}>{group.name}</Text>
                  <Text style={styles.categorySub} numberOfLines={1}>
                    {group.leaves.map((l) => l.formulaName).filter(Boolean).slice(0, 2).join(', ') ||
                      'Estimation data'}
                  </Text>
                  {tags.length > 0 && (
                    <View style={styles.tagsRow}>
                      {tags.map((tag, ti) => (
                        <View key={ti} style={styles.tag}>
                          <Text style={styles.tagText}>{tag.toUpperCase()}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </Pressable>
              );
            })
          )}

          {/* View All / Estimation History buttons (ACTIVE only) */}
          {!isCompleted && (
            <Pressable
              style={styles.viewAllBtn}
              onPress={() =>
                router.push({
                  pathname: '/(dashboard)/all-calculations/',
                  params: { projectId: id },
                })
              }
            >
              <Text style={styles.viewAllText}>View all activity →</Text>
            </Pressable>
          )}

          {/* ── Export PDF Button ── */}
          <TouchableOpacity
            style={styles.exportBtn}
            onPress={handleExportPDF}
            activeOpacity={0.8}
          >
            <FileDown size={20} color={theme.colors.primary} />
            <Text style={styles.exportBtnText}>Export PDF Report</Text>
          </TouchableOpacity>

          <Pressable
            style={styles.detailedHistoryBtn}
            onPress={() =>
              router.push({
                pathname: '/(dashboard)/estimation-history/',
                params: { projectId: id, isReadOnly: isCompleted ? 'true' : 'false' },
              })
            }
          >
            <Text style={styles.detailedHistoryText}>
              View Detailed Estimation History →
            </Text>
          </Pressable>

          {/* ── Recent Activity (ACTIVE only) ── */}
          {!isCompleted && recentCalculations.length > 0 && (
            <>
              <Text style={styles.sectionTitleRecent}>
                Recent Activity
              </Text>
              {recentCalculations.map((calc, idx) => (
                <View key={calc.id || `recent-${idx}`} style={styles.recentItemWrapper}>
                  <CalculationCard
                    item={calc as CalculationItem}
                    isReadOnly={isCompleted}
                    onPress={(c) =>
                      router.push({
                        pathname: '/(dashboard)/calculation-details/[id]',
                        params: { id: c.id || (c as any).projectDetailsId, projectId: id },
                      })
                    }
                  />
                  {!isCompleted && calc.projectDetailsId && (
                    <TouchableOpacity
                      style={styles.deleteLeafBtn}
                      onPress={() => handleDeleteLeaf(calc.projectDetailsId!, calc.categoryName || 'Calculation')}
                    >
                      <Trash2 size={16} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <Pressable
                style={styles.viewAllBtn}
                onPress={() =>
                  router.push({ pathname: '/(dashboard)/all-calculations/', params: { projectId: id } })
                }
              >
                <Text style={styles.viewAllText}>View all activity →</Text>
              </Pressable>
            </>
          )}

          {/* Action Buttons removed because they are not supported by the backend API contract */}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  } as ViewStyle,
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  } as ViewStyle,
  loadingText: { 
    ...theme.typography.bodyMedium,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  } as TextStyle,

  content: { padding: theme.spacing.lg } as ViewStyle,
  titleSection: {
    marginBottom: theme.spacing.lg,
  } as ViewStyle,
  title: { 
    ...theme.typography.h1,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  } as TextStyle,
  metaRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: theme.spacing.sm,
  } as ViewStyle,
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.roundness.sm,
  } as ViewStyle,
  statusActive: {
    backgroundColor: theme.colors.infoLight,
  } as ViewStyle,
  statusCompleted: {
    backgroundColor: theme.colors.successLight,
  } as ViewStyle,
  statusText: {
    ...theme.typography.caption,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  } as TextStyle,
  metaText: { 
    ...theme.typography.small,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  } as TextStyle,

  lockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.errorLight,
    padding: theme.spacing.md,
    borderRadius: theme.roundness.lg,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    marginBottom: theme.spacing.lg,
  } as ViewStyle,
  lockBannerText: { 
    color: theme.colors.error,
    ...theme.typography.small,
    fontWeight: '600',
    flex: 1,
  } as TextStyle,

  budgetCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.roundness.xxl,
    padding: theme.spacing.xl,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
    ...theme.shadows.md,
  } as ViewStyle,
  budgetHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: theme.spacing.sm, 
    marginBottom: theme.spacing.md,
  } as ViewStyle,
  budgetTitle: { 
    ...theme.typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'uppercase',
    fontWeight: '800',
  } as TextStyle,
  budgetContent: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
  } as ViewStyle,
  budgetMainValue: { 
    ...theme.typography.h1,
    color: theme.colors.white,
    fontSize: 28,
  } as TextStyle,
  budgetSubText: { 
    ...theme.typography.small,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  } as TextStyle,
  budgetIconCircle: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    backgroundColor: 'rgba(255, 255, 255, 0.2)', 
    alignItems: 'center', 
    justifyContent: 'center',
  } as ViewStyle,

  overviewCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.roundness.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.xl,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  } as ViewStyle,
  overviewLabel: { 
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    fontWeight: '800',
    marginBottom: theme.spacing.sm,
  } as TextStyle,
  overviewText: { 
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  } as TextStyle,

  statsRow: { 
    flexDirection: 'row', 
    gap: theme.spacing.md, 
    marginBottom: theme.spacing.xxl,
  } as ViewStyle,
  statCard: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderRadius: theme.roundness.lg,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    ...theme.shadows.xs,
  } as ViewStyle,
  statLabel: { 
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  } as TextStyle,
  statValue: { 
    ...theme.typography.h2,
    color: theme.colors.text,
    marginTop: 2,
  } as TextStyle,

  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: theme.spacing.md,
  } as ViewStyle,
  sectionTitle: { 
    ...theme.typography.h3,
    color: theme.colors.text,
  } as TextStyle,

  mainCategoriesRow: { 
    flexDirection: 'row', 
    gap: theme.spacing.md, 
    marginBottom: theme.spacing.md,
  } as ViewStyle,
  mainCatCard: {
    flex: 1,
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    borderRadius: theme.roundness.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    gap: theme.spacing.sm,
    ...theme.shadows.xs,
  } as ViewStyle,
  mainCatIcon: { 
    width: 48, 
    height: 48, 
    borderRadius: theme.roundness.md, 
    alignItems: 'center', 
    justifyContent: 'center',
  } as ViewStyle,
  mainCatText: { 
    ...theme.typography.small,
    fontWeight: '700', 
    color: theme.colors.text,
    textAlign: 'center',
  } as TextStyle,

  categoryCard: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.lg,
    borderRadius: theme.roundness.xl,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.xs,
  } as ViewStyle,
  categoryCardTop: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: theme.spacing.sm,
  } as ViewStyle,
  categoryIcon: { 
    width: 44, 
    height: 44, 
    borderRadius: theme.roundness.md, 
    alignItems: 'center', 
    justifyContent: 'center',
  } as ViewStyle,
  categoryCalcCount: { 
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    fontWeight: '800',
  } as TextStyle,
  categoryTitle: { 
    ...theme.typography.h4,
    color: theme.colors.text,
    marginBottom: 4,
  } as TextStyle,
  categorySub: { 
    ...theme.typography.small,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  } as TextStyle,
  tagsRow: { 
    flexDirection: 'row', 
    gap: theme.spacing.sm,
  } as ViewStyle,
  tag: { 
    backgroundColor: theme.colors.surface, 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: theme.roundness.sm, 
    borderWidth: 1, 
    borderColor: theme.colors.border,
  } as ViewStyle,
  tagText: { 
    ...theme.typography.caption,
    fontSize: 10,
    fontWeight: '800', 
    color: theme.colors.textSecondary,
  } as TextStyle,

  viewAllBtn: { 
    marginVertical: theme.spacing.md, 
    alignItems: 'center', 
    paddingVertical: theme.spacing.md,
  } as ViewStyle,
  viewAllText: { 
    ...theme.typography.bodyBold,
    color: theme.colors.primary, 
  } as TextStyle,

  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.roundness.xl,
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.primaryLight,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  } as ViewStyle,
  exportBtnText: {
    color: theme.colors.primary,
    ...theme.typography.bodyBold,
  } as TextStyle,
  recentItemWrapper: {
    position: 'relative',
    marginBottom: theme.spacing.sm,
  } as ViewStyle,
  deleteLeafBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: theme.roundness.sm,
    backgroundColor: theme.colors.errorLight,
    borderWidth: 1,
    borderColor: theme.colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  } as ViewStyle,
  imageContainer: {
    width: '100%',
    height: 220,
    borderRadius: theme.roundness.xxl,
    overflow: 'hidden',
    marginBottom: theme.spacing.xl,
    backgroundColor: theme.colors.surfaceSecondary,
    ...theme.shadows.sm,
  } as ViewStyle,
  heroImage: {
    width: '100%',
    height: '100%',
  } as ImageStyle,
  scrollContent: { paddingBottom: 120 } as ViewStyle,
  sectionHeaderHistory: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: theme.spacing.md,
    marginTop: 20,
  } as ViewStyle,
  detailedHistoryBtn: {
    marginVertical: theme.spacing.md, 
    alignItems: 'center', 
    paddingVertical: theme.spacing.md,
    marginTop: 8, 
    backgroundColor: '#EFF6FF', 
    borderWidth: 0,
    borderRadius: theme.roundness.lg,
  } as ViewStyle,
  detailedHistoryText: {
    ...theme.typography.bodyBold,
    color: theme.colors.primary, 
    fontWeight: '700',
  } as TextStyle,
  sectionTitleRecent: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginTop: 24, 
    marginBottom: 12,
  } as TextStyle,
});

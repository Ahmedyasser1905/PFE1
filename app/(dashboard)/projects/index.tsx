import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Image,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  HardHat,
  ChevronRight,
  ChevronLeft,
  FolderOpen,
  AlertCircle,
  BarChart3,
} from 'lucide-react-native';
import type { Project } from '~/api/types';
import { theme } from '~/constants/theme';
import { useProjects } from '~/hooks/useProjects';
import { formatCurrency, formatProjectId } from '~/utils/formatters';
import { Skeleton } from '~/components/ui/Skeleton';
import { EmptyState } from '~/components/ui/EmptyState';
import { ErrorScreen } from '~/components/ui/ErrorScreen';
import { resolveImageUrl, FALLBACK_IMAGE } from '~/utils/imageResolver';
import { useLanguage } from '~/context/LanguageContext';

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme.colors.background 
  } as ViewStyle,
  center: { 
    justifyContent: 'center', 
    alignItems: 'center' 
  } as ViewStyle,
  scrollContent: { 
    padding: theme.spacing.lg, 
    paddingBottom: 100 
  } as ViewStyle,
  scrollContentEmpty: { 
    flex: 1, 
    justifyContent: 'center' 
  } as ViewStyle,

  filterTabs: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    padding: 4,
    borderRadius: theme.roundness.lg,
    marginBottom: theme.spacing.lg,
    gap: 4,
    borderWidth: 1,
    borderColor: theme.colors.divider,
  } as ViewStyle,
  filterTabsRtl: {
    flexDirection: 'row-reverse',
  } as ViewStyle,
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: theme.roundness.md,
  } as ViewStyle,
  filterTabActive: {
    backgroundColor: theme.colors.white,
    ...theme.shadows.xs,
  } as ViewStyle,
  filterTabText: { 
    ...theme.typography.small,
    fontWeight: '700', 
    color: theme.colors.textSecondary 
  } as TextStyle,
  filterTabTextActive: { 
    color: theme.colors.primary 
  } as TextStyle,

  loadingText: { 
    ...theme.typography.body,
    color: theme.colors.textSecondary, 
    marginTop: 12,
  } as TextStyle,

  projectCard: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.lg,
    borderRadius: theme.roundness.xl,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    ...theme.shadows.sm,
  } as ViewStyle,
  projectCardPressed: { 
    backgroundColor: theme.colors.surface, 
    borderColor: theme.colors.primaryLight 
  } as ViewStyle,
  projectCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  } as ViewStyle,
  projectCardTopRtl: {
    flexDirection: 'row-reverse',
  } as ViewStyle,
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: theme.roundness.md,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  } as ViewStyle,
  projectImage: {
    width: '100%',
    height: '100%',
  } as ImageStyle,
  statusBadge: { 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: theme.roundness.sm 
  } as ViewStyle,
  statusText: { 
    ...theme.typography.caption,
    fontWeight: '800', 
    letterSpacing: 0.5, 
    color: theme.colors.white 
  } as TextStyle,
  projectName: { 
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: 4,
    textAlign: 'left',
  } as TextStyle,
  projectDesc: { 
    ...theme.typography.small,
    color: theme.colors.textSecondary, 
    lineHeight: 20, 
    marginBottom: theme.spacing.md,
    textAlign: 'left',
  } as TextStyle,
  projectStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  } as ViewStyle,
  projectStatsRowRtl: {
    flexDirection: 'row-reverse',
  } as ViewStyle,
  projectStat: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: theme.spacing.xs 
  } as ViewStyle,
  projectStatRtl: {
    flexDirection: 'row-reverse',
  } as ViewStyle,
  projectStatText: { 
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    fontWeight: '700',
  } as TextStyle,
  projectCost: { 
    ...theme.typography.bodyBold,
    color: theme.colors.primary,
  } as TextStyle,
  projectFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
  } as ViewStyle,
  projectFooterRtl: {
    flexDirection: 'row-reverse',
  } as ViewStyle,
  projectId: { 
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    fontWeight: '800', 
    letterSpacing: 0.5 
  } as TextStyle,
  mb12: { marginBottom: 12 } as ViewStyle,
  mb6: { marginBottom: 6 } as ViewStyle,
  mb20: { marginBottom: 20 } as ViewStyle,
  loadingCard: { height: 160, marginBottom: 12 } as ViewStyle,
  badgeSuccess: { backgroundColor: theme.colors.success } as ViewStyle,
  badgePrimary: { backgroundColor: theme.colors.primaryLight } as ViewStyle,
  rtlText: {
    textAlign: 'right',
  } as TextStyle,
});

type TabType = 'active' | 'completed';

export default function ProjectsScreen() {
  const router = useRouter();
  const { projects, loading, refreshing, error, refresh, refetch } = useProjects();
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const { t, isRTL } = useLanguage();

  const filtered = useMemo(
    () =>
      projects.filter(
        (p) => p.status === activeTab
      ),
    [projects, activeTab]
  );

  const keyExtractor = useCallback((item: Project) => item.projectId, []);

  const renderItem = useCallback(
    ({ item: project }: { item: Project }) => {
      const isCompleted = project.status === 'completed';
      return (
        <Pressable
          style={({ pressed }) => [styles.projectCard, pressed && styles.projectCardPressed]}
          onPress={() =>
            router.push({
              pathname: '/(dashboard)/projects/[id]/',
              params: { id: project.projectId },
            })
          }
        >
          <View style={[styles.projectCardTop, isRTL && styles.projectCardTopRtl]}>
            <View style={styles.iconBox}>
              {project.imageUrl ? (
                <Image
                  source={{ uri: resolveImageUrl(project.imageUrl) }}
                  style={styles.projectImage}
                  resizeMode="cover"
                  defaultSource={{ uri: FALLBACK_IMAGE }}
                  onError={() => {
                    if (__DEV__) console.log('[ProjectsList] image load failed for', project.projectId, project.imageUrl);
                  }}
                />
              ) : (
                <HardHat size={22} color={theme.colors.primary} />
              )}
            </View>
            <View
              style={[
                styles.statusBadge,
                isCompleted ? styles.badgeSuccess : styles.badgePrimary,
              ]}
            >
              <Text style={styles.statusText}>
                {t(`projects.status_${project.status}`).toUpperCase()}
              </Text>
            </View>
          </View>

          <Text style={[styles.projectName, isRTL && styles.rtlText]}>{project.name}</Text>
          {project.description ? (
            <Text style={[styles.projectDesc, isRTL && styles.rtlText]} numberOfLines={2}>
              {project.description}
            </Text>
          ) : null}

          <View style={[styles.projectStatsRow, isRTL && styles.projectStatsRowRtl]}>
            <View style={[styles.projectStat, isRTL && styles.projectStatRtl]}>
              <BarChart3 size={14} color={theme.colors.muted} />
              <Text style={styles.projectStatText}>
                {project.leafCount || 0} {t('projects.estimations_count')}
              </Text>
            </View>
            {project.totalCost != null && !isNaN(Number(project.totalCost)) && (
              <Text style={styles.projectCost}>{formatCurrency(project.totalCost)}</Text>
            )}
          </View>

          <View style={[styles.projectFooter, isRTL && styles.projectFooterRtl]}>
            <Text style={styles.projectId}>{formatProjectId(project.projectId)}</Text>
            {isRTL ? (
              <ChevronLeft size={18} color={theme.colors.muted} />
            ) : (
              <ChevronRight size={18} color={theme.colors.muted} />
            )}
          </View>
        </Pressable>
      );
    },
    [router, isRTL, t]
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <View style={styles.scrollContent}>
          <View style={[styles.filterTabs, isRTL && styles.filterTabsRtl]}>
            <Skeleton width="50%" height={40} borderRadius={8} />
            <Skeleton width="50%" height={40} borderRadius={8} />
          </View>
          {[1, 2, 3, 4].map((key) => (
            <View key={key} style={[styles.projectCard, styles.loadingCard]}>
               <View style={[styles.projectCardTop, isRTL && styles.projectCardTopRtl]}>
                 <Skeleton width={44} height={44} borderRadius={12} />
                 <Skeleton width={80} height={24} borderRadius={6} />
               </View>
               <Skeleton width="70%" height={20} style={[styles.mb12, isRTL && { alignSelf: 'flex-end' }] as any} />
               <Skeleton width="100%" height={14} style={styles.mb6} />
               <Skeleton width="90%" height={14} style={[styles.mb20, isRTL && { alignSelf: 'flex-end' }] as any} />
               <View style={[styles.projectFooter, isRTL && styles.projectFooterRtl]}>
                 <Skeleton width={100} height={14} />
               </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filtered}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          filtered.length === 0 && styles.scrollContentEmpty,
        ]}
        removeClippedSubviews
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        ListHeaderComponent={
          error ? (
            <ErrorScreen
              type={error.includes('Network') ? 'network' : 'unknown'}
              message={error}
              onRetry={refetch}
            />
          ) : (
            <View style={[styles.filterTabs, isRTL && styles.filterTabsRtl]}>
              <Pressable
                style={[styles.filterTab, activeTab === 'active' && styles.filterTabActive]}
                onPress={() => setActiveTab('active')}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    activeTab === 'active' && styles.filterTabTextActive,
                  ]}
                >
                  {t('projects.active')}
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.filterTab,
                  activeTab === 'completed' && styles.filterTabActive,
                ]}
                onPress={() => setActiveTab('completed')}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    activeTab === 'completed' && styles.filterTabTextActive,
                  ]}
                >
                  {t('projects.completed')}
                </Text>
              </Pressable>
            </View>
          )
        }
        ListEmptyComponent={
          !error ? (
            <EmptyState
              title={t('projects.no_projects')}
              description={t('projects.create_first')}
              actionLabel={t('projects.start_first')}
              onAction={() => router.push('/projects/create')}
            />
          ) : null
        }
      />
    </View>
  );
}

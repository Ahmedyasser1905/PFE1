import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Feather, MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { estimationApi } from '~/api/api';
import { useCategories } from '~/hooks/useCategories';
import { useLanguage } from '~/context/LanguageContext';
import { theme } from '~/constants/theme';
import type { Category, SavedLeafCalculation } from '~/api/types';
import { logger, parseError } from '~/utils/errorHandler';

// ─────────────────────────────────────────────
// ICON RESOLVER
// ─────────────────────────────────────────────
const ICON_SIZE = 24;
const ICON_COLOR = theme.colors.primary;

const resolveIcon = (icon: string | null): React.ReactNode => {
  const map: Record<string, React.ReactNode> = {
    building: <FontAwesome5 name="building" size={ICON_SIZE} color={ICON_COLOR} />,
    foundation: <MaterialIcons name="foundation" size={ICON_SIZE} color={ICON_COLOR} />,
    grid: <FontAwesome5 name="th-large" size={ICON_SIZE} color={ICON_COLOR} />,
    home: <Feather name="home" size={ICON_SIZE} color={ICON_COLOR} />,
    hammer: <FontAwesome5 name="hammer" size={ICON_SIZE} color={ICON_COLOR} />,
    tools: <FontAwesome5 name="tools" size={ICON_SIZE} color={ICON_COLOR} />,
    layers: <Feather name="layers" size={ICON_SIZE} color={ICON_COLOR} />,
    box: <Feather name="box" size={ICON_SIZE} color={ICON_COLOR} />,
    settings: <Feather name="settings" size={ICON_SIZE} color={ICON_COLOR} />,
    road: <FontAwesome5 name="road" size={ICON_SIZE} color={ICON_COLOR} />,
    water: <FontAwesome5 name="water" size={ICON_SIZE} color={ICON_COLOR} />,
    bolt: <FontAwesome5 name="bolt" size={ICON_SIZE} color={ICON_COLOR} />,
    blueprint: <Ionicons name="map-outline" size={ICON_SIZE} color={ICON_COLOR} />,
    crane: <FontAwesome5 name="truck-loading" size={ICON_SIZE} color={ICON_COLOR} />,
    wall: <MaterialIcons name="view-column" size={ICON_SIZE} color={ICON_COLOR} />,
    wood: <FontAwesome5 name="tree" size={ICON_SIZE} color={ICON_COLOR} />,
    concrete: <FontAwesome5 name="cubes" size={ICON_SIZE} color={ICON_COLOR} />,
    pipe: <FontAwesome5 name="tint" size={ICON_SIZE} color={ICON_COLOR} />,
    paint: <FontAwesome5 name="paint-roller" size={ICON_SIZE} color={ICON_COLOR} />,
  };
  if (icon && map[icon]) return map[icon];
  return <Feather name="grid" size={ICON_SIZE} color={ICON_COLOR} />;
};

// ─────────────────────────────────────────────
// CATEGORY CARD COMPONENT
// ─────────────────────────────────────────────
const CategoryCard: React.FC<{
  item: Category;
  onPress: (item: Category) => void;
  calcCount: number;
  isArabic: boolean;
}> = React.memo(({ item, onPress, calcCount, isArabic }) => {
  const isLeaf = item.categoryLevel === 'LEAF';
  const hasChildren = item.children && item.children.length > 0;
  const displayName = isArabic ? item.nameAr : item.nameEn;
  const subName = isArabic ? item.nameEn : item.nameAr;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => onPress(item)}
    >
      <View style={styles.iconContainer}>
        {resolveIcon(item.icon)}
      </View>
      <View style={[styles.cardContent, isArabic && styles.rtlContent]}>
        <Text style={[styles.cardTitle, isArabic && styles.rtlText]}>{displayName}</Text>
        <Text style={[styles.cardSubtitle, isArabic && styles.rtlText]}>{subName}</Text>
        {item.descriptionEn && !isArabic && (
          <Text style={styles.cardDescription} numberOfLines={1}>{item.descriptionEn}</Text>
        )}
        {item.descriptionAr && isArabic && (
          <Text style={[styles.cardDescription, styles.rtlText]} numberOfLines={1}>{item.descriptionAr}</Text>
        )}
      </View>
      {isLeaf && (
        <View style={[styles.countBadge, calcCount > 0 ? styles.countBadgeActive : styles.countBadgeEmpty]}>
          <Text style={[styles.countText, calcCount > 0 ? styles.countTextActive : styles.countTextEmpty]}>
            {calcCount > 0 ? `${calcCount}` : '–'}
          </Text>
        </View>
      )}
      {!isLeaf && hasChildren && (
        <View style={styles.childCountBadge}>
          <Text style={styles.childCountText}>{item.children!.length}</Text>
        </View>
      )}
      <Feather
        name={isArabic ? 'chevron-left' : 'chevron-right'}
        size={20}
        color="#CBD5E1"
      />
    </Pressable>
  );
});

// ─────────────────────────────────────────────
// BREADCRUMB COMPONENT
// ─────────────────────────────────────────────
const Breadcrumbs: React.FC<{
  path: string[];
  isArabic: boolean;
}> = React.memo(({ path, isArabic }) => {
  if (path.length === 0) return null;
  const separator = isArabic ? ' ‹ ' : ' › ';
  const items = isArabic ? [...path].reverse() : path;

  return (
    <Text style={[styles.breadcrumb, isArabic && styles.rtlText]} numberOfLines={1}>
      {items.join(separator)}
    </Text>
  );
});

// ─────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────
export default function CategoriesScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const isArabic = language === 'ar';

  const { parentId, title, id, breadcrumb } = useLocalSearchParams<{
    parentId: string;
    title: string;
    id: string;
    breadcrumb: string;
  }>();

  // Determine if we're at root level or navigating into children
  const isRoot = !parentId;

  // Use the centralized hook for category fetching
  const {
    categories,
    loading,
    refreshing,
    error,
    refresh,
  } = useCategories({ parentId: parentId || undefined });

  // Estimation data for leaf calculation counts
  const [estimations, setEstimations] = useState<SavedLeafCalculation[]>([]);

  useEffect(() => {
    if (!id) return;
    estimationApi
      .getProjectEstimation(id)
      .then((data) => {
        if (data?.leafCalculations) {
          setEstimations(data.leafCalculations);
        }
      })
      .catch(() => {});
  }, [id]);

  // Build breadcrumb path from param
  const breadcrumbPath = useMemo(() => {
    const base = isArabic ? t('categories.title') : 'Categories';
    if (!breadcrumb) return [base];
    try {
      const parsed = JSON.parse(breadcrumb);
      return Array.isArray(parsed) ? [base, ...parsed] : [base];
    } catch {
      return breadcrumb ? [base, breadcrumb] : [base];
    }
  }, [breadcrumb, isArabic, t]);

  // Get calculation count for a leaf category
  const getCalcCount = useCallback((catId: string) => {
    return estimations.filter(est => est.categoryId === catId).length;
  }, [estimations]);

  // Handle category press — navigate deeper or open leaf
  const handleCategoryPress = useCallback(
    (item: Category) => {
      const level = (item.categoryLevel || '').toUpperCase();
      if (level === 'LEAF') {
        router.push({
          pathname: `/projects/${id}/category/${item.categoryId}`,
          params: {
            id,
            categoryId: item.categoryId,
            title: isArabic ? item.nameAr : item.nameEn,
          },
        });
      } else {
        // Navigate deeper into children
        const newBreadcrumb = [...breadcrumbPath.slice(1), isArabic ? item.nameAr : item.nameEn];
        router.push({
          pathname: `/projects/${id}/categories`,
          params: {
            id,
            parentId: item.categoryId,
            title: isArabic ? item.nameAr : item.nameEn,
            breadcrumb: JSON.stringify(newBreadcrumb),
          },
        });
      }
    },
    [router, id, isArabic, breadcrumbPath]
  );

  // Render item for FlatList
  const renderItem = useCallback(
    ({ item }: { item: Category }) => (
      <CategoryCard
        item={item}
        onPress={handleCategoryPress}
        calcCount={getCalcCount(item.categoryId)}
        isArabic={isArabic}
      />
    ),
    [handleCategoryPress, getCalcCount, isArabic]
  );

  const keyExtractor = useCallback((item: Category) => item.categoryId, []);

  // Determine screen title
  const screenTitle = title || (isArabic ? t('categories.title') : 'Categories');
  const screenSubtitle = isRoot
    ? (isArabic ? t('categories.root_subtitle') : 'Select a construction domain to explore.')
    : (isArabic ? t('categories.child_subtitle') : `Browse items in ${title || 'this category'}.`);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={categories}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        removeClippedSubviews
        initialNumToRender={15}
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
          <View style={styles.titleSection}>
            <Breadcrumbs path={breadcrumbPath} isArabic={isArabic} />
            <Text style={[styles.screenTitle, isArabic && styles.rtlText]}>
              {screenTitle}
            </Text>
            <Text style={[styles.subtitle, isArabic && styles.rtlText]}>
              {screenSubtitle}
            </Text>
            {!isRoot && (
              <View style={styles.categoryCount}>
                <Feather name="layers" size={14} color={theme.colors.textSecondary} />
                <Text style={styles.categoryCountText}>
                  {categories.length} {categories.length === 1 ? 'item' : 'items'}
                </Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loaderText}>
                {isArabic ? t('common.loading') : 'Loading categories...'}
              </Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Feather name="alert-circle" size={40} color="#FCA5A5" />
              <Text style={styles.errorMsg}>{error}</Text>
              <Pressable style={styles.retryBtn} onPress={refresh}>
                <Text style={styles.retryBtnText}>
                  {isArabic ? t('common.retry') : 'Retry'}
                </Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Feather name="inbox" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>
                {isArabic ? t('categories.empty') : 'No categories available'}
              </Text>
              <Text style={styles.emptySubtext}>
                {isArabic ? t('categories.empty_hint') : 'Categories are managed by the administrator.'}
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  } as ViewStyle,
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: 40,
    gap: 10,
  } as ViewStyle,

  // ── Header ─────────────────────────────────
  titleSection: {
    marginBottom: theme.spacing.md,
  } as ViewStyle,
  breadcrumb: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginBottom: 4,
    letterSpacing: 0.3,
  } as TextStyle,
  screenTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    letterSpacing: -0.5,
  } as TextStyle,
  subtitle: {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
    marginTop: 4,
    lineHeight: 20,
  } as TextStyle,
  categoryCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.md,
    alignSelf: 'flex-start',
  } as ViewStyle,
  categoryCountText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  } as TextStyle,

  // ── Card ───────────────────────────────────
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    padding: theme.spacing.lg,
    borderRadius: theme.roundness.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.xs,
  } as ViewStyle,
  cardPressed: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.primary,
    transform: [{ scale: 0.98 }],
  } as ViewStyle,
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.roundness.md,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.lg,
  } as ViewStyle,
  cardContent: {
    flex: 1,
  } as ViewStyle,
  rtlContent: {
    alignItems: 'flex-end',
  } as ViewStyle,
  cardTitle: {
    ...theme.typography.bodyBold,
    color: theme.colors.text,
  } as TextStyle,
  cardSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    marginTop: 2,
  } as TextStyle,
  cardDescription: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: 4,
    fontSize: 11,
  } as TextStyle,

  // ── Badges ─────────────────────────────────
  countBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  } as ViewStyle,
  countBadgeActive: {
    backgroundColor: theme.colors.infoLight,
  } as ViewStyle,
  countBadgeEmpty: {
    backgroundColor: theme.colors.surfaceSecondary,
  } as ViewStyle,
  countText: {
    ...theme.typography.caption,
    fontSize: 12,
    fontWeight: '800',
  } as TextStyle,
  countTextActive: {
    color: theme.colors.info,
  } as TextStyle,
  countTextEmpty: {
    color: theme.colors.textMuted,
  } as TextStyle,
  childCountBadge: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.roundness.sm,
    marginRight: theme.spacing.sm,
  } as ViewStyle,
  childCountText: {
    ...theme.typography.caption,
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.primary,
  } as TextStyle,

  // ── States ─────────────────────────────────
  loader: {
    marginTop: 80,
    alignItems: 'center',
    gap: 12,
  } as ViewStyle,
  loaderText: {
    ...theme.typography.bodyMedium,
    color: theme.colors.textSecondary,
  } as TextStyle,
  errorContainer: {
    marginTop: 80,
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
  } as ViewStyle,
  errorMsg: {
    ...theme.typography.body,
    color: theme.colors.error,
    textAlign: 'center',
  } as TextStyle,
  retryBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: theme.roundness.lg,
    marginTop: 8,
  } as ViewStyle,
  retryBtnText: {
    color: theme.colors.white,
    fontWeight: '700',
  } as TextStyle,
  emptyContainer: {
    marginTop: 80,
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
  } as ViewStyle,
  emptyText: {
    ...theme.typography.bodyMedium,
    color: theme.colors.textMuted,
    textAlign: 'center',
  } as TextStyle,
  emptySubtext: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  } as TextStyle,

  // ── RTL ────────────────────────────────────
  rtlText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  } as TextStyle,
});

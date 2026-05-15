/**
 * CalculationCard — Reusable card for displaying a single saved calculation.
 *
 * Used across: estimation-history, all-calculations, project detail (recent activity).
 * This eliminates the duplicated card layout that existed in 3+ screens.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { HardHat, Clock, ChevronRight, Trash2 } from 'lucide-react-native';
import { theme } from '../../../constants/theme';
import { useLanguage } from '~/context/LanguageContext';

export interface CalculationItem {
  id: string;
  category?: string;
  categoryName?: string;
  type?: string;
  formulaName?: string;
  subCategory?: string;
  result?: number;
  totalCost?: number;
  leafTotal?: number;
  createdAt?: string;
  projectId?: string;
  projectDetailsId?: string;
  isLocal?: boolean;
}

interface CalculationCardProps {
  item: CalculationItem;
  onPress: (item: CalculationItem) => void;
  /** If true, hides the delete button (completed/read-only project) */
  isReadOnly?: boolean;
  onDelete?: (id: string) => void;
  showChevron?: boolean;
}

export const CalculationCard = React.memo<CalculationCardProps>(
  ({ item, onPress, isReadOnly = false, onDelete, showChevron = true }) => {
    const { t } = useLanguage();
    const title = (item.categoryName || item.category || t('calc_details.calculation')).toUpperCase();
    const subTitle = item.formulaName || item.type || item.subCategory || '';
    const dateStr = new Date(item.createdAt || Date.now()).toLocaleDateString();
    const amount = Number(item.totalCost || item.result || item.leafTotal || 0).toLocaleString();

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.75}
        onPress={() => onPress(item)}
      >
        {/* Header row */}
        <View style={styles.cardHeader}>
          <View style={styles.cardInfo}>
            <View style={styles.iconBox}>
              <HardHat size={16} color={theme.colors.primary} />
            </View>
            <Text style={styles.cardTitle} numberOfLines={1}>{title}</Text>
          </View>
          <View style={styles.cardActions}>
            {!isReadOnly && onDelete && (
              <TouchableOpacity
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                onPress={() => onDelete(item.id)}
                style={styles.deleteBtn}
              >
                <Trash2 size={16} color="#EF4444" />
              </TouchableOpacity>
            )}
            {showChevron && <ChevronRight size={18} color="#CBD5E1" />}
          </View>
        </View>

        {/* Footer row */}
        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.price}>DZD {amount}</Text>
            {!!subTitle && <Text style={styles.subType}>{subTitle}</Text>}
          </View>
          <View style={styles.dateBadge}>
            <Clock size={11} color="#64748B" />
            <Text style={styles.dateText}>{dateStr}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }
);

CalculationCard.displayName = 'CalculationCard';

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  } as ViewStyle,
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  } as ViewStyle,
  cardInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 } as ViewStyle,
  iconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: 0.5,
    flexShrink: 1,
  } as TextStyle,
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 8 } as ViewStyle,
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  } as ViewStyle,
  price: { fontSize: 18, fontWeight: '900', color: theme.colors.primary } as TextStyle,
  subType: { fontSize: 10, color: '#94A3B8', fontWeight: '700', marginTop: 2 } as TextStyle,
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  } as ViewStyle,
  dateText: { fontSize: 11, color: '#64748B', fontWeight: '600' } as TextStyle,
});

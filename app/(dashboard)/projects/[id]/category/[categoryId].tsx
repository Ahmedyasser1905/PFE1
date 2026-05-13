import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  ActivityIndicator,

  Platform,
  Dimensions,
  Keyboard,
  Modal,
  FlatList,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Calculator,
  ChevronDown,
  Share2,
  Printer,
  Bookmark,
  DollarSign,
  Sigma,
  Plus,
  LayoutGrid
} from 'lucide-react-native';
import { estimationApi } from '~/api/api';
import { theme } from '~/constants/theme';
import { useSubscriptionContext } from '~/context/SubscriptionContext';
import type { LeafDetail, CalculationResult, Formula, FieldDefinition, MaterialConfig, CalculateRequest, Category } from '~/api/types';
import { NativeSelect } from '~/components/ui/NativeSelect';
import { Skeleton } from '~/components/ui/Skeleton';
import { ErrorScreen } from '~/components/ui/ErrorScreen';
import { useFeedback } from '~/context/FeedbackContext';

const { width } = Dimensions.get('window');

// ── Styles ──────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  } as ViewStyle,
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  } as ViewStyle,

  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 40,
  } as ViewStyle,
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    gap: theme.spacing.md,
  } as ViewStyle,
  titleIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  pageTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
  } as TextStyle,
  pageSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: 2,
    fontWeight: '600',
  } as TextStyle,

  // Subcategory (Browse Mode)
  subCatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.white,
    padding: theme.spacing.lg,
    borderRadius: theme.roundness.lg,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    ...theme.shadows.xs,
  } as ViewStyle,
  subCatText: {
    ...theme.typography.bodyBold,
    color: theme.colors.text,
  } as TextStyle,

  // Card Base
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.roundness.xl,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    ...theme.shadows.sm,
  } as ViewStyle,
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  } as ViewStyle,
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm
  } as ViewStyle,
  cardTitle: {
    ...theme.typography.caption,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: 1,
  } as TextStyle,
  cardBody: {
    padding: theme.spacing.lg
  } as ViewStyle,

  // Inputs
  inputGroup: {
    marginBottom: theme.spacing.lg
  } as ViewStyle,
  inputLabel: {
    ...theme.typography.caption,
    fontWeight: '800',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    letterSpacing: 0.8,
  } as TextStyle,
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
  } as ViewStyle,
  textInput: {
    flex: 1,
    ...theme.typography.bodyBold,
    color: theme.colors.text,
  } as TextStyle,
  unitTag: {
    ...theme.typography.caption,
    fontWeight: '800',
    color: theme.colors.textMuted,
  } as TextStyle,

  calculateBtn: {
    height: 60,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.roundness.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
    ...theme.shadows.md,
  } as ViewStyle,
  calculateBtnText: {
    color: theme.colors.white,
    ...theme.typography.bodyBold,
    letterSpacing: 1,
  } as TextStyle,
  btnDisabled: {
    opacity: 0.7,
  } as ViewStyle,
  resetLink: {
    alignSelf: 'center',
    marginTop: theme.spacing.lg,
    padding: 8
  } as ViewStyle,
  resetLinkText: {
    ...theme.typography.caption,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    letterSpacing: 0.5,
  } as TextStyle,

  // Results (Blue Card)
  resultsCard: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    ...theme.shadows.md,
  } as ViewStyle,
  readyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.success
  } as ViewStyle,
  readyBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  } as ViewStyle,
  readyBadgeText: {
    ...theme.typography.caption,
    fontWeight: '800',
    color: theme.colors.white,
    letterSpacing: 0.5,
  } as TextStyle,
  resultsGrid: {
    padding: theme.spacing.lg,
    gap: 12
  } as ViewStyle,
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  } as ViewStyle,
  resultItemTotal: {
    marginTop: 8,
    borderBottomWidth: 0,
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 12,
    borderRadius: 8,
  } as ViewStyle,
  resultLabel: {
    ...theme.typography.caption,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '700',
  } as TextStyle,
  resultLabelTotal: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '800'
  } as TextStyle,
  resultValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4
  } as ViewStyle,
  resultValue: {
    ...theme.typography.h3,
    color: theme.colors.white,
  } as TextStyle,
  resultValueTotal: {
    fontSize: 24,
    fontWeight: '900'
  } as TextStyle,
  resultUnit: {
    ...theme.typography.caption,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
  } as TextStyle,
  resultUnitTotal: {
    color: theme.colors.white,
    opacity: 0.9
  } as TextStyle,

  materialsSection: {
    marginTop: 12,
    backgroundColor: 'rgba(0,0,0,0.1)',
    padding: 12,
    borderRadius: 12,
  } as ViewStyle,
  materialsHeader: {
    ...theme.typography.caption,
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 8,
    letterSpacing: 1,
  } as TextStyle,
  materialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  } as ViewStyle,
  materialInfo: { flex: 1 } as ViewStyle,
  materialName: {
    ...theme.typography.small,
    fontWeight: '700',
    color: theme.colors.white,
  } as TextStyle,
  materialQty: {
    ...theme.typography.caption,
    color: 'rgba(255,255,255,0.7)',
  } as TextStyle,
  materialCostBox: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  } as ViewStyle,
  materialCost: {
    ...theme.typography.small,
    fontWeight: '800',
    color: theme.colors.white,
  } as TextStyle,
  totalCostDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 4,
  } as ViewStyle,

  // Cost Estimation
  optionalBadge: {
    backgroundColor: theme.colors.surfaceSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.roundness.sm
  } as ViewStyle,
  optionalBadgeText: {
    ...theme.typography.caption,
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.textSecondary
  } as TextStyle,
  helperText: {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16
  } as TextStyle,
  outlineBtn: {
    height: 52,
    borderRadius: theme.roundness.lg,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  } as ViewStyle,
  outlineBtnText: {
    color: theme.colors.primary,
    ...theme.typography.bodyBold,
    fontSize: 14,
    letterSpacing: 0.5
  } as TextStyle,

  // Formulas
  formulaGroup: { gap: 8 } as ViewStyle,
  formulaLabel: {
    ...theme.typography.caption,
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.textMuted,
    letterSpacing: 0.5
  } as TextStyle,
  formulaDisplay: {
    backgroundColor: theme.colors.surface,
    padding: 12,
    borderRadius: theme.roundness.md,
    borderWidth: 1,
    borderColor: theme.colors.divider,
  } as ViewStyle,
  formulaDisplayText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
  } as TextStyle,

  // Footer Save Btn
  saveBtn: {
    height: 56,
    borderRadius: theme.roundness.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10,
  } as ViewStyle,
  saveBtnText: {
    color: theme.colors.primary,
    ...theme.typography.bodyBold,
    fontSize: 14,
    letterSpacing: 0.5
  } as TextStyle,
  sectionTitleRecent: {
    ...theme.typography.h3,
    color: theme.colors.white,
    marginTop: 24, 
    marginBottom: 12,
  } as TextStyle,
  resultsTitle: {
    ...theme.typography.caption,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  } as TextStyle,
  spacer40: { height: 40 } as ViewStyle,
  flex1: { flex: 1 } as ViewStyle,
  gap12: { gap: 12 } as ViewStyle,
  rotate90: { transform: [{ rotate: '-90deg' }] } as ViewStyle,
  skeletonTextContainer: { flex: 1, marginLeft: 16 } as ViewStyle,
  mt8: { marginTop: 8 } as ViewStyle,
  mb20: { marginBottom: 20 } as ViewStyle,
});

// ── Components ───────────────────────────────

const ResultItem = ({ label, value, unit, isTotal }: { label: string; value: string; unit: string; isTotal?: boolean }) => (

  <View style={[styles.resultItem, isTotal && styles.resultItemTotal]}>
    <Text style={[styles.resultLabel, isTotal && styles.resultLabelTotal]}>{label}</Text>
    <View style={styles.resultValueRow}>
      <Text style={[styles.resultValue, isTotal && styles.resultValueTotal]}>{value}</Text>
      <Text style={[styles.resultUnit, isTotal && styles.resultUnitTotal]}>{unit}</Text>
    </View>
  </View>
);

export default function LeafCalculationScreen() {
  const router = useRouter();
  const { id, categoryId, title, projectName, editId } = useLocalSearchParams<{
    id: string;
    categoryId: string;
    title?: string;
    projectName?: string;
    editId?: string;
  }>();

  // ── State ────────────────────────────────────
  const [viewMode, setViewMode] = useState<'browse' | 'calculate'>('browse');
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [leaf, setLeaf] = useState<LeafDetail | null>(null);
  const [projectTitle, setProjectTitle] = useState<string>(projectName || 'PROJECT');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Derived Display Strings
  const displayTitle = (title || leaf?.nameEn || 'Category').toString();
  const displayProjectName = (projectTitle || 'Project').toString();
  const { canCalculate, hasSubscription, incrementCalculationUsage } = useSubscriptionContext();
  const { showFeedback } = useFeedback();

  // Selection
  const [selectedFormula, setSelectedFormula] = useState<Formula | null>(null);
  const [selectedConfig, setSelectedConfig] = useState<MaterialConfig | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

  // Modal state for material configuration & formula selection
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showFormulaModal, setShowFormulaModal] = useState(false);

  // Results
  const [results, setResults] = useState<CalculationResult | any>(null);
  const [error, setError] = useState<string | null>(null);

  // ── Initialization ───────────────────────────
  const initCategory = useCallback(async () => {
    if (!categoryId) return;
    try {
      setLoading(true);
      setError(null);

      // Fetch project data — validate estimation row exists BEFORE allowing calculation
      if (id) {
        try {
          const projectData = await estimationApi.getProject(id);
          setProjectTitle(projectData?.name || 'PROJECT');

          // CRITICAL GUARD: If estimationId is null, the DB has no estimation row
          // for this project. saveLeaf will always 500 until this is fixed.
          // This happens when a project was created before the auto-estimation logic,
          // or when the image-upload fallback path skipped the estimation INSERT.
          if (!projectData?.estimationId) {
            throw new Error(
              'This project has no estimation record. ' +
              'Please delete it and create a new project to resolve the issue.'
            );
          }
        } catch (pErr: any) {
          // Re-throw our own typed error; swallow unrelated network errors
          if (pErr.message && pErr.message.includes('no estimation record')) throw pErr;
          console.warn('Failed to fetch project data:', pErr);
          setProjectTitle('PROJECT');
        }
      }

      // 1. Check if category has children (BRANCH)
      const children = await estimationApi.getCategoryChildren(categoryId).catch(() => []);

      if (children && children.length > 0) {
        setSubcategories(children);
        setViewMode('browse');
      } else {
        // 2. No children, assume LEAF
        try {
          const leafData = await estimationApi.getCategoryLeaf(categoryId);
          setLeaf(leafData);
          setViewMode('calculate');

          if (leafData?.formulas && leafData.formulas.length > 0) {
            setSelectedFormula(leafData.formulas[0]);
            const defaults: Record<string, string> = {};
            leafData.formulas[0].fields.forEach((f: FieldDefinition) => {
              defaults[f.fieldId] = (f.defaultValue ?? 0).toString();
            });
            setFieldValues(defaults);
          }
          if (leafData?.configs && leafData.configs.length > 0) {
            setSelectedConfig(leafData.configs[0]);
          }
        } catch (err: any) {
          throw new Error(`Category not found or invalid: ${err.message}`);
        }
      }
    } catch (err: any) {
      console.error('Init Category Error:', err);
      setError(err.message || 'Failed to load category details');
    } finally {
      setLoading(false);
    }
  }, [categoryId, id]);

  useEffect(() => {
    initCategory();
  }, [initCategory]);

  // ── Handlers ─────────────────────────────────
  // Store raw user input as-is (string). Normalization happens only at calculate time.
  const handleInputChange = useCallback((fieldId: string, value: string) => {
    setFieldValues(prev => ({ ...prev, [fieldId]: value }));
  }, []);

  // Material configuration selection handler
  const handleMaterialConfig = useCallback((config: MaterialConfig) => {
    setSelectedConfig(config);
    setShowConfigModal(false);
  }, []);

  // Formula selection handler — resets fields to new defaults
  const handleFormulaSelect = useCallback((formula: Formula) => {
    setSelectedFormula(formula);
    setShowFormulaModal(false);
    setResults(null);
    const defaults: Record<string, string> = {};
    formula.fields.forEach((f: FieldDefinition) => {
      defaults[f.fieldId] = (f.defaultValue ?? 0).toString();
    });
    setFieldValues(defaults);
  }, []);

  const handleCalculate = useCallback(async () => {
    if (!selectedFormula || !leaf || !id) return;

    // PRE-FLIGHT GUARD: Abort immediately if leaf or project state is inconsistent.
    // This is a secondary safety net — the primary guard is in initCategory.
    if (!leaf.categoryId) {
      showFeedback({ title: 'Error', message: 'Invalid category data. Please go back and try again.', type: 'error' });
      return;
    }

    // Subscription guard: warn if at calculation limit
    if (hasSubscription && !canCalculate) {
      showFeedback({
        title: 'Calculation Limit Reached',
        message: 'You have reached your plan\'s calculation limit. Please upgrade to perform more calculations.',
        type: 'warning'
      });
      return;
    }

    Keyboard.dismiss();
    try {
      setCalculating(true);

      // 1. SAFE INPUT MAPPING: Parse all defined fields for the selected formula, fallback to 0
      const numericFields: Record<string, number> = {};
      (selectedFormula.fields || []).forEach(field => {
        const rawValue = fieldValues[field.fieldId] || '';
        const normalized = rawValue.replace(/,/g, '.').trim();
        numericFields[field.fieldId] = parseFloat(normalized) || 0;
      });

      const calcPayload: CalculateRequest = {
        category_id: leaf.categoryId,
        selected_formula_id: selectedFormula.formulaId,
        selected_config_id: selectedConfig?.configId ?? null,
        field_values: numericFields,
        project_name: displayProjectName,
        category_name: displayTitle,
        project_id: id,
      };

      // 2. RUN ENGINE: Stateless preview calculation
      const response = await estimationApi.calculatePreview(calcPayload);
      setResults(response);
      incrementCalculationUsage(); // Increment usage locally for real-time tracking

    } catch (err: any) {
      console.error('[LeafCalc] Handler Error:', err);
      showFeedback({
        title: 'Calculation Error',
        message: err.message || 'Failed to sync calculation with project.',
        type: 'error'
      });
    } finally {
      setCalculating(false);
    }
  }, [selectedFormula, leaf, selectedConfig, fieldValues, canCalculate, hasSubscription, incrementCalculationUsage, showFeedback, displayProjectName, displayTitle, id]);

  const handleSave = useCallback(async () => {
    if (!selectedFormula || !leaf || !id || !results) {
      showFeedback({ title: 'Notice', message: 'Please calculate results first before saving.', type: 'info' });
      return;
    }

    try {
      setSaving(true);

      const numericFields: Record<string, number> = {};
      (selectedFormula.fields || []).forEach(field => {
        const rawValue = fieldValues[field.fieldId] || '';
        const normalized = rawValue.replace(/,/g, '.').trim();
        numericFields[field.fieldId] = parseFloat(normalized) || 0;
      });

      const resultObj: Record<string, number> = {};
      if (results.intermediateResults && results.intermediateResults.length > 0) {
        results.intermediateResults.forEach((item: any) => {
          const safeKey = item.outputKey || item.output_key;
          if (safeKey) resultObj[safeKey] = typeof item.value === 'number' ? item.value : 0;
        });
      } else if (results.results && typeof results.results === 'object') {
        Object.assign(resultObj, results.results);
      }

      const totalFromMaterials = (results.materialLines || []).reduce((sum: number, m: any) => sum + (Number(m.subTotal) || 0), 0);
      const leafTotal = Number(results.totalCost) > 0 ? Number(results.totalCost) : totalFromMaterials;
      resultObj['_computed_leaf_total'] = Number(leafTotal) || 0;

      const formulaVersion = Number(selectedFormula.version ?? 1) || 1;
      const savePayload: any = {
        project_id: String(id || ''),
        category_id: String(leaf.categoryId || ''),
        selected_formula_id: String(selectedFormula.formulaId || ''),
        selected_config_id: selectedConfig?.configId ?? null,
        project_details_id: editId ?? null,
        field_values: numericFields,
        formula_version_snapshot: formulaVersion,
        results: Object.keys(resultObj).length > 0 ? resultObj : {},
        leaf_total: Number(leafTotal) || 0,
        material_lines: (results.materialLines || []).map((ml: any) => ({
          material_id: String(ml.materialId || ml.material_id || ''),
          material_name: String(ml.materialName || ml.material_name || 'Unknown Material'),
          material_type: String(ml.materialType || ml.material_type || 'PRIMARY'),
          quantity: Number(ml.quantity) || 0,
          applied_waste: Number(ml.appliedWaste ?? ml.applied_waste ?? 0) || 0,
          quantity_with_waste: Number(ml.quantityWithWaste ?? ml.quantity_with_waste ?? 0) || 0,
          unit_price_snapshot: Number(ml.unitPriceSnapshot ?? ml.unit_price_snapshot ?? 0) || 0,
          waste_factor_snapshot: Number(ml.wasteFactorSnapshot ?? ml.waste_factor_snapshot ?? 0) || 0,
          sub_total: Number(ml.subTotal ?? ml.sub_total ?? 0) || 0,
        })),
        // Plan §6.4: service_lines must always be present even when empty
        service_lines: [],
      };

      if (__DEV__) {
        console.log('[LeafCalc] Saving Payload:', JSON.stringify(savePayload, null, 2));
      }

      const response = await estimationApi.saveLeaf(savePayload);

      if (__DEV__) {
        console.log('[LeafCalc] Save Response:', JSON.stringify(response, null, 2));
      }

      showFeedback({
        title: 'Success',
        message: 'Calculation saved successfully.',
        type: 'success',
      });
    } catch (err: any) {
      console.error('[LeafCalc] Save Error:', err);
      showFeedback({
        title: 'Save Error',
        message: err.message || 'Failed to save calculation.',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  }, [selectedFormula, leaf, id, results, selectedConfig, fieldValues, showFeedback, editId]);

  const handleReset = useCallback(() => {
    if (selectedFormula) {
      const defaults: Record<string, string> = {};
      selectedFormula.fields.forEach((f: FieldDefinition) => {
        defaults[f.fieldId] = (f.defaultValue ?? 0).toString();
      });
      setFieldValues(defaults);
      setResults(null);
    }
  }, [selectedFormula]);

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.titleSection}>
            <Skeleton width={48} height={48} borderRadius={24} />
            <View style={styles.skeletonTextContainer}>
              <Skeleton width="60%" height={24} />
              <Skeleton width="40%" height={16} style={styles.mt8} />
            </View>
          </View>
          <Skeleton width="100%" height={200} borderRadius={16} style={styles.mb20} />
          <Skeleton width="100%" height={150} borderRadius={16} style={styles.mb20} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (error) return (
    <ErrorScreen
      type={error.includes('estimation record') ? 'server' : 'unknown'}
      title="Calculation Error"
      message={error}
      onRetry={initCategory}
    />
  );

  if (viewMode === 'browse') {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.titleSection}>
            <View style={styles.titleIconBox}>
              <LayoutGrid size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.flex1}>
              <Text style={styles.pageTitle}>{displayTitle}</Text>
              <Text style={styles.pageSubtitle}>Select a sub-category to continue</Text>
            </View>
          </View>

          <View style={styles.gap12}>
            {subcategories.map(sub => (
              <Pressable
                key={sub.categoryId}
                style={styles.subCatCard}
                onPress={() => router.push({
                  pathname: '/(dashboard)/projects/[id]/category/[categoryId]',
                  params: { id, categoryId: sub.categoryId, title: sub.nameEn }
                })}
              >
                <Text style={styles.subCatText}>{sub.nameEn}</Text>
                <ChevronDown style={styles.rotate90} size={20} color="#CBD5E1" />
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── CALCULATE MODE (Leaf) ──────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* 2. Title Section */}
        <View style={styles.titleSection}>
          <View style={styles.titleIconBox}>
            <Calculator size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.flex1}>
            <Text style={styles.pageTitle}>{displayTitle}</Text>
            <Text style={styles.pageSubtitle} numberOfLines={2}>Structural quantities configuration for construction items.</Text>
          </View>
        </View>

        {/* 3. Input Dimensions Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Calculator size={16} color={theme.colors.primary} />
              <Text style={styles.cardTitle}>INPUT DIMENSIONS</Text>
            </View>
            <Bookmark size={18} color="#CBD5E1" />
          </View>

          <View style={styles.cardBody}>
            {(selectedFormula?.fields || []).map((field) => (
              <View key={field.fieldId} style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {(field.label || '').toUpperCase()} {field.unitSymbol ? `(${(field.unitSymbol || '').toUpperCase()})` : ''}
                </Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    value={fieldValues[field.fieldId] || ''}
                    onChangeText={(v) => handleInputChange(field.fieldId, v)}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor="#94A3B8"
                  />
                  <Text style={styles.unitTag}>{(field.unitSymbol || '').toUpperCase()}</Text>
                </View>
              </View>
            ))}

            {leaf?.configs && leaf.configs.length > 0 && (
              <NativeSelect<MaterialConfig>
                label="MATERIAL CONFIGURATION"
                placeholder="Select Configuration"
                value={selectedConfig}
                options={leaf.configs}
                keyExtractor={(item) => item.configId}
                labelExtractor={(item) => item.name}
                onSelect={handleMaterialConfig}
              />
            )}

            <Pressable
              style={[styles.calculateBtn, calculating && styles.btnDisabled]}
              onPress={handleCalculate}
              disabled={calculating}
            >
              {calculating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Calculator size={20} color="#fff" />
                  <Text style={styles.calculateBtnText}>CALCULATE ESTIMATION</Text>
                </>
              )}
            </Pressable>

            <Pressable style={styles.resetLink} onPress={handleReset}>
              <Text style={styles.resetLinkText}>↺ RESET VALUES</Text>
            </Pressable>
          </View>
        </View>

        {/* 4. Results Card (Blue Style) */}
        <View style={[styles.card, styles.resultsCard]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <View style={styles.readyDot} />
              <Text style={styles.resultsTitle}>RESULTS</Text>
            </View>
            <View style={styles.readyBadge}>
              <Text style={styles.readyBadgeText}>{results ? 'READY' : 'PENDING'}</Text>
            </View>
          </View>

          <View style={styles.resultsGrid}>
            {(() => {
              try {
                if (!results) {
                  return <ResultItem label="PENDING" value="0.00" unit={selectedFormula?.outputUnitSymbol || ''} />;
                }

                const renderedItems = [];

                // 1. Intermediates
                const intermediates = results.intermediateResults || [];
                if (intermediates.length > 0) {
                  intermediates.forEach((r: any, idx: number) => {
                    const label = (
                      r?.outputLabel ?? r?.output_label ?? r?.label ?? r?.outputKey ?? r?.output_key ?? 'Result'
                    ).replace(/_/g, ' ').toUpperCase();
                    const value = typeof r?.value === 'number' ? r.value.toFixed(2) : '0.00';
                    const unit = r?.unitSymbol ?? r?.unit_symbol ?? '';
                    renderedItems.push(
                      <ResultItem
                        key={`int-${r?.outputKey || r?.output_key || idx}`}
                        label={label}
                        value={value}
                        unit={unit}
                      />
                    );
                  });
                } else {
                  // Fallback to basic results dict
                  const resObj = results.results || {};
                  Object.entries(resObj).forEach(([key, val]) => {
                    renderedItems.push(
                      <ResultItem
                        key={`res-${key}`}
                        label={(key || 'Result').replace(/_/g, ' ').toUpperCase()}
                        value={typeof val === 'number' ? (val as number).toFixed(2) : '0.00'}
                        unit={''}
                      />
                    );
                  });
                }

                // 2. Material Lines
                const materials = results.materialLines || [];
                if (materials.length > 0) {
                  renderedItems.push(
                    <View key="materials-section" style={styles.materialsSection}>
                      <Text style={styles.materialsHeader}>MATERIALS BREAKDOWN</Text>
                      {materials.map((m: any, idx: number) => {
                        const name = m.materialNameEn || m.materialName || 'Material';
                        const qty = typeof m.quantityWithWaste === 'number' ? m.quantityWithWaste.toFixed(2) : '0.00';
                        const unit = m.unitSymbol || '';
                        const cost = typeof m.subTotal === 'number' ? m.subTotal.toFixed(2) : '0.00';
                        return (
                          <View key={`mat-${idx}`} style={styles.materialRow}>
                            <View style={styles.materialInfo}>
                              <Text style={styles.materialName}>{name}</Text>
                              <Text style={styles.materialQty}>{qty} {unit}</Text>
                            </View>
                            <View style={styles.materialCostBox}>
                              <Text style={styles.materialCost}>{cost} DZD</Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  );
                }

                // 3. Total Cost
                if (results.totalCost != null) {
                  renderedItems.push(
                    <View key="total-cost" style={styles.totalCostDivider} />
                  );
                  renderedItems.push(
                    <ResultItem
                      key="total-cost-item"
                      label="TOTAL ESTIMATED COST"
                      value={results.totalCost.toFixed(2)}
                      unit="DZD"
                      isTotal
                    />
                  );
                }

                if (renderedItems.length === 0) {
                  return <ResultItem label="PENDING" value="0.00" unit={selectedFormula?.outputUnitSymbol || ''} />;
                }

                return renderedItems;
              } catch (err) {
                console.error('[LeafCalc] Error rendering results:', err);
                return <ResultItem label="ERROR" value="0.00" unit="" />;
              }
            })()}
          </View>
        </View>

        {results && (
          <Pressable
            style={[styles.saveBtn, saving && styles.btnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={theme.colors.primary} />
            ) : (
              <>
                <Bookmark size={20} color={theme.colors.primary} />
                <Text style={styles.saveBtnText}>SAVE TO PROJECT HISTORY</Text>
              </>
            )}
          </Pressable>
        )}

        {/* ── Cost Estimation Card removed as it's merged into the main flow ── */}

        {/* 6. Formulas Card */}
        {leaf?.formulas && leaf.formulas.length > 0 && (
          <NativeSelect<Formula>
            label="CALCULATION METHOD"
            placeholder="Select Formula"
            value={selectedFormula}
            options={leaf.formulas}
            keyExtractor={(item) => item.formulaId}
            labelExtractor={(item) => item.nameEn}
            onSelect={handleFormulaSelect}
          />
        )}

        {selectedFormula && (
          <View style={styles.formulaDisplay}>
            <Text style={styles.formulaDisplayText}>{selectedFormula.expression || 'V = L * W * H'}</Text>
          </View>
        )}

        {/* Footer Button removed as it's merged into CALCULATE ESTIMATION */}

        <View style={styles.spacer40} />
      </ScrollView>

    </SafeAreaView>
  );
}

// ── Styles ──────────────────────────────────



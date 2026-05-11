/**
 * Apex — API Response Mappers
 *
 * This is the SINGLE normalization layer between backend responses and frontend domain models.
 * All snake_case → camelCase conversions happen HERE and NOWHERE ELSE.
 *
 * Architecture: Backend → API Layer → Mappers → Hooks → UI
 *
 * Rules:
 *  1. Every backend response MUST pass through a mapper before reaching hooks/UI
 *  2. Mappers MUST return clean domain types (camelCase, normalized enums)
 *  3. UI MUST NEVER import Raw* types — only clean domain types
 */

import type {
  RawProject,
  RawCategory,
  RawUser,
  RawEstimationReport,
  RawSavedLeafCalculation,
  RawMaterialLine,
  RawIntermediateResult,
  RawCalculationResult,
  RawLeafDetail,
  RawFormula,
  RawFieldDefinition,
  RawMaterialConfig,
  RawSubscription,
  RawUsage,
  RawPlan,
  RawPlanFeature,
  RawPlanType,
  // Clean domain types
  Project,
  Category,
  User,
  EstimationReport,
  SavedLeafCalculation,
  MaterialLine,
  IntermediateResult,
  CalculationResult,
  LeafDetail,
  Formula,
  FieldDefinition,
  MaterialConfig,
  Subscription,
  Usage,
  Plan,
  PlanFeature,
  PlanType,
} from './types';

// ─── Project Mappers ──────────────────────────────────────────────────────────

/**
 * Normalizes a raw project response into a clean domain model.
 * - image_url → imageUrl
 * - created_at → createdAt
 * - project_id → projectId
 * - estimation_id → estimationId
 * - total_cost → totalCost
 * - leaf_count → leafCount
 * - user_id → userId
 * - status: ACTIVE/ARCHIVED/FINISHED/COMPLETED → 'active' | 'completed'
 */
export function mapProjectFromAPI(raw: RawProject): Project {
  const s = (raw?.status || '').toUpperCase();
  let normalizedStatus: Project['status'] = 'active';
  if (s === 'ARCHIVED' || s === 'FINISHED' || s === 'COMPLETED') {
    normalizedStatus = 'completed';
  }

  return {
    projectId: raw?.project_id || '',
    name: raw?.name || 'Untitled Project',
    description: raw?.description ?? null,
    status: normalizedStatus,
    createdAt: raw?.created_at || new Date().toISOString(),
    estimationId: raw?.estimation_id || '',
    // Force Number() coercion: postgres drivers can return numerics as strings in some configs
    totalCost: Number(raw?.total_cost ?? 0),
    leafCount: Number(raw?.leaf_count ?? 0),
    userId: raw?.user_id,
    imageUrl: raw?.imageUrl || raw?.image_url || raw?.image || raw?.imagePath || null,
    budgetEstimation: Number(raw?.total_cost ?? 0),
    estimationStatus: normalizedStatus === 'completed' ? 'CALCULATED' : 'ACTIVE',
    estimatedBudget: Number(raw?.total_cost ?? 0),
    lastCalculationId: (raw as any)?.last_calculation_id || null,
    calculationStatus: normalizedStatus === 'completed' ? 'DONE' : 'PENDING',
    budgetCategory: raw?.budget_category ?? null,
  };
}

export function mapProjectsFromAPI(raw: RawProject[]): Project[] {
  return Array.isArray(raw) ? raw.map(mapProjectFromAPI) : [];
}

// ─── Category Mappers ─────────────────────────────────────────────────────────

/**
 * Normalizes a raw category response.
 * - category_id → categoryId
 * - parent_id → parentId
 * - category_level → categoryLevel
 * - name_en → nameEn
 * - name_ar → nameAr
 * - sort_order → sortOrder
 */
export function mapCategoryFromAPI(raw: RawCategory): Category {
  return {
    categoryId: raw.category_id,
    parentId: raw.parent_id,
    categoryLevel: raw.category_level,
    nameEn: raw.name_en,
    nameAr: raw.name_ar,
    icon: raw.icon,
    sortOrder: raw.sort_order,
  };
}

export function mapCategoriesFromAPI(raw: RawCategory[]): Category[] {
  return Array.isArray(raw) ? raw.map(mapCategoryFromAPI) : [];
}

// ─── User Mapper ──────────────────────────────────────────────────────────────

/**
 * Normalizes a raw user response.
 * - avatar_url → avatarUrl
 */
export function mapUserFromAPI(raw: RawUser): User {
  if (!raw) {
    return { id: '', name: 'Unknown', email: '', role: 'CLIENT' };
  }
  return {
    id: raw.id || '',
    name: raw.name || 'Unknown',
    email: raw.email || '',
    role: raw.role || 'CLIENT',
    avatarUrl: raw.avatar_url,
    language: raw.language,
    status: raw.status,
    createdAt: raw.created_at,
  };
}

// ─── Material Line Mapper ─────────────────────────────────────────────────────

export function mapMaterialLineFromAPI(raw: RawMaterialLine): MaterialLine {
  return {
    materialId: raw?.material_id || '',
    materialName: raw?.material_name || 'Unknown Material',
    materialNameEn: raw?.material_name_en,
    materialNameAr: raw?.material_name_ar,
    materialType: raw?.material_type || 'PRIMARY',
    quantity: raw?.quantity ?? 0,
    appliedWaste: raw?.applied_waste ?? 0,
    quantityWithWaste: raw?.quantity_with_waste ?? 0,
    unitPriceSnapshot: raw?.unit_price_snapshot ?? 0,
    wasteFactorSnapshot: raw?.waste_factor_snapshot ?? 0,
    subTotal: raw?.sub_total ?? 0,
    unitSymbol: raw?.unit_symbol,
  };
}

// ─── Intermediate Result Mapper ───────────────────────────────────────────────

export function mapIntermediateResultFromAPI(raw: RawIntermediateResult): IntermediateResult {
  // outputKey is the DB-safe identifier, outputLabel is just a display string
  // NEVER use outputLabel as a map key — only outputKey
  const outputKey = (raw?.output_key || 'unknown').trim().toLowerCase().replace(/\s+/g, '_');
  
  // outputLabel is OPTIONAL — derived from backend if present, fallback to readable outputKey
  const outputLabel: string =
    (typeof raw?.output_label === 'string' && raw.output_label.trim() !== '')
      ? raw.output_label
      : outputKey.replace(/_/g, ' ');

  return {
    formulaId: raw?.formula_id || '',
    formulaVersion: Number(raw?.formula_version ?? 0),
    outputKey,
    outputLabel,
    // Force Number() coercion: engine can return numeric as string in edge cases
    value: Number(raw?.value ?? 0),
    unitSymbol: raw?.unit_symbol || '',
  };
}

// ─── Calculation Result Mapper ────────────────────────────────────────────────

export function mapCalculationResultFromAPI(raw: RawCalculationResult): CalculationResult {
  // Defensively map intermediate results — never crash on malformed data
  let intermediateResults: IntermediateResult[] = [];
  try {
    intermediateResults = (raw?.intermediate_results || [])
      .filter((r: any) => r != null)
      .map(mapIntermediateResultFromAPI);
  } catch (e) {
    console.warn('[Mapper] Failed to map intermediate_results:', e);
  }
  
  // Build results map: prefer raw.results (from backend engine), fallback to intermediate_results
  // CRITICAL: ALWAYS use outputKey as the map key — NEVER outputLabel
  // outputLabel is only for display; outputKey is what gets stored in project_details.results JSONB
  let results = raw?.results;
  if (!results || typeof results !== 'object' || Object.keys(results).length === 0) {
    results = intermediateResults.reduce((acc, r) => {
      const safeKey = (r.outputKey || 'unknown').trim().toLowerCase().replace(/\s+/g, '_');
      if (safeKey) acc[safeKey] = r.value;
      return acc;
    }, {} as Record<string, number>);
  }

  // Defensively map material lines
  let materialLines: MaterialLine[] = [];
  try {
    materialLines = (raw?.material_lines || [])
      .filter((ml: any) => ml != null)
      .map(mapMaterialLineFromAPI);
  } catch (e) {
    console.warn('[Mapper] Failed to map material_lines:', e);
  }

  return {
    results,
    intermediateResults,
    materialLines,
    // Force Number() coercion: postgres drivers can return numerics as strings in some configs
    totalCost: Number(raw?.total_cost ?? 0),
  };
}

// ─── Saved Leaf Calculation Mapper ────────────────────────────────────────────

export function mapSavedLeafFromAPI(raw: RawSavedLeafCalculation): SavedLeafCalculation {
  let materialLines: MaterialLine[] = [];
  try {
    materialLines = (raw?.material_lines || [])
      .filter((ml: any) => ml != null)
      .map(mapMaterialLineFromAPI);
  } catch (e) {
    console.warn('[Mapper] Failed to map saved leaf material_lines:', e);
  }

    // Server calculates leaf_total by summing material lines.
    // If the formula is purely computational (no materials), leaf_total will be 0.
    // We must fallback to the calculated result stored in the JSONB results column.
    let leafTotal = Number(raw?.leaf_total ?? 0);
    if (leafTotal === 0 && raw?.results && typeof raw.results === 'object') {
      const res = raw.results as Record<string, any>;
      // Look for common output keys used by the engine for total costs
      const fallback = res['cout_total'] ?? res['total_cost'] ?? res['total'] ?? res['prix_total'] ?? res['cost'] ?? 0;
      if (typeof fallback === 'number' || typeof fallback === 'string') {
        leafTotal = Number(fallback) || 0;
      }
    }

    return {
      projectDetailsId: raw?.project_details_id || '',
      categoryId: raw?.category_id || '',
      // Server returns name_en/name_ar via JOIN — prefer them over the aliased category_name
      categoryName: raw?.category_name_en || raw?.category_name_ar || raw?.category_name || 'Unknown',
      selectedFormulaId: raw?.selected_formula_id || '',
      // Same pattern for formula name
      formulaName: raw?.formula_name_en || raw?.formula_name_ar || raw?.formula_name || 'Unknown Formula',
      selectedConfigId: raw?.selected_config_id ?? null,
      configName: raw?.config_name ?? null,
      // Force Number() coercion: postgres drivers can return numerics as strings in some configs
      formulaVersionSnapshot: Number(raw?.formula_version_snapshot ?? 0),
      fieldValues: raw?.field_values || {},
      results: raw?.results || {},
      createdAt: raw?.created_at || new Date().toISOString(),
      leafTotal,
      materialLines,
    };
}

// ─── Estimation Report Mapper ─────────────────────────────────────────────────

export function mapEstimationFromAPI(raw: RawEstimationReport): EstimationReport {
  let leafCalculations: SavedLeafCalculation[] = [];
  try {
    leafCalculations = (raw?.leaf_calculations || [])
      .filter((lc: any) => lc != null)
      .map(mapSavedLeafFromAPI);
  } catch (e) {
    console.warn('[Mapper] Failed to map leaf_calculations:', e);
  }

  return {
    estimationId: raw?.estimation_id || '',
    projectId: raw?.project_id || '',
    budgetType: raw?.budget_type || 'MEDIUM',
    // Force Number() coercion for all monetary/count fields:
    // postgres drivers can return numeric types as strings in some configurations.
    totalBudget: Number(raw?.total_budget ?? 0),
    totalCost: Number(raw?.total_cost ?? 0),
    leafCount: Number(raw?.leaf_count ?? 0),
    createdAt: raw?.created_at || new Date().toISOString(),
    leafCalculations,
  };
}

// ─── Formula & Leaf Detail Mappers ────────────────────────────────────────────

export function mapFieldDefinitionFromAPI(raw: RawFieldDefinition): FieldDefinition {
  return {
    fieldId: raw.field_id,
    label: raw.label,
    labelAr: raw.label_ar,
    required: raw.required,
    defaultValue: raw.default_value,
    sortOrder: raw.sort_order,
    unitSymbol: raw.unit_symbol,
    isComputed: raw.is_computed,
  };
}

export function mapFormulaFromAPI(raw: RawFormula): Formula {
  return {
    formulaId: raw.formula_id,
    nameEn: raw.name_en,
    nameAr: raw.name_ar,
    expression: raw.expression,
    version: raw.version,
    outputUnitSymbol: raw.output_unit_symbol,
    fields: (raw.fields || []).map(mapFieldDefinitionFromAPI),
  };
}

export function mapMaterialConfigFromAPI(raw: RawMaterialConfig): MaterialConfig {
  return {
    configId: raw.config_id,
    name: raw.name,
    description: raw.description,
  };
}

export function mapLeafDetailFromAPI(raw: RawLeafDetail): LeafDetail {
  return {
    ...mapCategoryFromAPI(raw),
    formulas: (raw.formulas || []).map(mapFormulaFromAPI),
    configs: (raw.configs || []).map(mapMaterialConfigFromAPI),
  };
}

// ─── Subscription & Usage Mappers ─────────────────────────────────────────────

export function mapSubscriptionFromAPI(raw: RawSubscription | any): Subscription {
  if (!raw) {
    return {
      planName: 'Free Plan',
      planType: null,
      subscriptionStatus: 'INACTIVE',
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      planId: null,
      isActive: false,
      features: {},
    };
  }

  console.log("SUB RESPONSE:", raw);

  // Server shape after envelope unwrap:
  // { status, subscription_id, plan: { name, price, duration },
  //   period: { start, end }, features_snapshot, billingCycle }
  const status = raw?.status || raw?.subscription_status || 'INACTIVE';
  const isActive = status.toUpperCase() === 'ACTIVE' || raw?.is_active === true;

  // Plan name lives in the nested plan object
  let planName = 'Free Plan';
  if (raw?.plan && typeof raw.plan === 'object') {
    planName = raw.plan.name || raw.plan.name_en || 'Free Plan';
  } else if (raw?.plan_name) {
    planName = raw.plan_name;
  }

  // Plan type (server doesn't send this explicitly, default to STANDARD)
  let planType = 'STANDARD';
  if (raw?.plan && typeof raw.plan === 'object') {
    planType = raw.plan.type || raw.plan.plan_type || 'STANDARD';
  } else if (raw?.plan_type) {
    planType = raw.plan_type;
  }

  console.log("SUB PLAN NAME:", planName);
  console.log("IS ACTIVE:", isActive);

  return {
    planName,
    planType,
    subscriptionStatus: status,
    // Server uses period.start / period.end — check those first
    startDate: raw?.period?.start || raw?.start_date || new Date().toISOString(),
    endDate:   raw?.period?.end   || raw?.end_date   || new Date().toISOString(),
    // Server uses subscription_id at top level, not plan_id
    planId: raw?.plan_id || raw?.subscription_id || null,
    isActive,
    features: raw?.features_snapshot || {},
  };
}

export function mapUsageFromAPI(raw: any): Usage {
  if (!raw) {
    return {
      projectsLimit: { used: 0, limit: 0 },
      aiUsageLimit: { used: 0, limit: 0 },
      leafCalculationsLimit: { used: 0, limit: 0 },
    };
  }

  const mapUsageItem = (item: any, fallbackUsed?: number, fallbackLimit?: number) => {
    if (!item) {
      return { used: fallbackUsed ?? 0, limit: fallbackLimit ?? 0 };
    }
    const used = item?.used ?? item?.used_calculations ?? item?.usage ?? fallbackUsed ?? 0;
    const limit = item?.unlimited ? -1 : (item?.limit ?? item?.max_calculations ?? fallbackLimit ?? 0);
    return { used: Number(used) || 0, limit: typeof limit === 'number' ? limit : (parseInt(String(limit)) || 0) };
  };

  return {
    projectsLimit: mapUsageItem(raw?.usage?.projects, raw?.projects?.used, raw?.projects?.limit),
    aiUsageLimit: mapUsageItem(raw?.usage?.ai, raw?.ai?.used, raw?.ai?.limit),
    // Fallback to top-level used_calculations and max_calculations if present
    leafCalculationsLimit: mapUsageItem(
      raw?.usage?.estimations || raw?.usage?.calculations,
      raw?.used_calculations ?? raw?.usage ?? 0,
      raw?.max_calculations ?? raw?.limit ?? 0
    ),
  };
}

// ─── Plan Mappers ─────────────────────────────────────────────────────────────

export function mapPlanFeatureFromAPI(raw: any): PlanFeature {
  return {
    featureKey: raw.feature_key || raw.key || '',
    featureValue: raw.feature_value ?? raw.val ?? '',
  };
}

export function mapPlanFromAPI(raw: any): Plan {
  // Server's getPlans returns features as an object { key: value }
  // but admin endpoint returns features as an array [{ feature_key, feature_value_en }]
  // Handle both shapes:
  let features: PlanFeature[] = [];
  if (raw.features) {
    if (Array.isArray(raw.features)) {
      features = raw.features.map(mapPlanFeatureFromAPI);
    } else if (typeof raw.features === 'object') {
      features = Object.entries(raw.features).map(([key, value]) => ({
        featureKey: key,
        featureValue: value as string | number | boolean,
      }));
    }
  }

  return {
    planId: raw.plan_id || raw.id,
    nameEn: raw.name_en,
    nameAr: raw.name_ar,
    descriptionEn: raw.description_en ?? deriveDescriptionFromFeatures(features),
    descriptionAr: raw.description_ar ?? undefined,
    price: raw.price,
    duration: raw.duration,
    planTypeId: raw.plan_type_id,
    planTypeName: raw.plan_type_name,
    features,
  };
}

function deriveDescriptionFromFeatures(features: PlanFeature[]): string | undefined {
  if (!features?.length) return undefined;
  const projectsFeature = features.find(f => f.featureKey === 'projects_limit');
  if (projectsFeature) {
    const v = projectsFeature.featureValue;
    return v === -1 || v === 'unlimited' ? 'Unlimited projects' : `Up to ${v} projects`;
  }
  return undefined;
}

export function mapPlansFromAPI(raw: RawPlan[]): Plan[] {
  return Array.isArray(raw) ? raw.map(mapPlanFromAPI) : [];
}

export function mapPlanTypeFromAPI(raw: RawPlanType): PlanType {
  return {
    planTypeId: raw.plan_type_id,
    nameEn: raw.name_en,
    nameAr: raw.name_ar,
  };
}

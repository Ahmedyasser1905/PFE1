/**
 * Apex API Types
 * Derived from api-contract.html
 *
 * Architecture:
 *  - Raw* types: exact backend response shapes (snake_case)
 *  - Clean types: frontend domain models (camelCase)
 *  - Mappers (api/mappers.ts) convert Raw → Clean
 *  - UI MUST ONLY use Clean types
 */

// ─── API Response Envelope ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  status: 'ok' | 'error';
  data: T;
  message?: string;
  errors?: Array<{ field: string; message: string }>;
}

// ══════════════════════════════════════════════════════════════════════════════
// RAW TYPES — Backend Response Shapes (snake_case, DO NOT use in UI)
// ══════════════════════════════════════════════════════════════════════════════

// 🔐 Authentication (Raw)
export interface RawUser {
  id: string;
  name: string;
  email: string;
  role: 'CLIENT' | 'ADMIN' | string;
  avatar_url?: string;
  language?: 'en' | 'ar';
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | string;
  created_at?: string;
}

export interface AuthResponse {
  user: RawUser;
  accessToken: string;
  refreshToken: string;
  subscription?: AuthSubscriptionSnapshot | null;
}

/** Lightweight subscription info embedded in login/register responses */
export interface AuthSubscriptionSnapshot {
  subscription_id: string;
  plan_id: string;
  plan_name: string;
  end_date: string;
  features_snapshot: Record<string, any>;
}

// 🗂️ Categories (Raw)
export type CategoryLevel = 'ROOT' | 'BRANCH' | 'LEAF' | 'DOMAIN' | 'SUB_TYPE';

export interface RawCategory {
  category_id: string;
  parent_id: string | null;
  category_level: CategoryLevel;
  name_en: string;
  name_ar: string;
  description_en?: string | null;
  description_ar?: string | null;
  icon: string | null;
  sort_order: number;
  children?: RawCategory[];
}

export interface RawLeafDetail extends RawCategory {
  formulas: RawFormula[];
  configs: RawMaterialConfig[];
}

export interface RawFormula {
  formula_id: string;
  name_en: string;
  name_ar: string;
  expression: string;
  version: number;
  output_unit_symbol: string;
  fields: RawFieldDefinition[];
}

export interface RawFieldDefinition {
  field_id: string;
  label: string;
  label_ar: string;
  required: boolean;
  default_value: number | null;
  sort_order: number;
  unit_symbol: string;
  is_computed: boolean;
}

export interface RawMaterialConfig {
  config_id: string;
  name: string;
  description: string | null;
}

// 🧮 Calculation (Raw)
export interface CalculateRequest {
  category_id: string;
  selected_formula_id: string;
  selected_config_id: string | null;
  field_values: Record<string, number>;
  project_name?: string;
  category_name?: string;
  project_id?: string;
  email?: string;
}

export interface RawMaterialLine {
  material_id: string;
  material_name: string;
  material_name_en?: string;
  material_name_ar?: string;
  material_type: 'PRIMARY' | 'ACCESSORY';
  quantity: number;
  applied_waste: number;
  quantity_with_waste: number;
  unit_price_snapshot: number;
  waste_factor_snapshot: number;
  sub_total: number;
  unit_symbol?: string;
}

export interface RawIntermediateResult {
  formula_id: string;
  formula_version: number;
  output_key: string;
  output_label?: string;
  value: number;
  unit_symbol: string;
}

export interface RawCalculationResult {
  results?: Record<string, number>;
  intermediate_results: RawIntermediateResult[];
  material_lines: RawMaterialLine[];
  total_cost: number;
}

// 📁 Projects (Raw)
export interface RawProject {
  project_id: string;
  name: string;
  description: string | null;
  status: 'ACTIVE' | 'ARCHIVED' | 'FINISHED' | string;
  created_at: string;
  estimation_id: string;
  total_cost: number;
  leaf_count: number;
  user_id?: string;
  image_url?: string;
  image?: string;
  imagePath?: string;
  imageUrl?: string;
  budget_category?: string | null;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  budget_type?: 'LOW' | 'MEDIUM' | 'HIGH';
  total_budget?: number;
}

export interface RawEstimationReport {
  estimation_id: string;
  project_id: string;
  budget_type: string;
  total_budget: number;
  total_cost?: number;
  leaf_count?: number;
  created_at: string;
  leaf_calculations: RawSavedLeafCalculation[];
}

export interface RawSavedLeafCalculation {
  project_details_id: string;
  category_id: string;
  category_name?: string;       // legacy alias — may not be present
  category_name_en?: string;   // server sends this (JOIN on categories.name_en)
  category_name_ar?: string;   // server sends this (JOIN on categories.name_ar)
  selected_formula_id: string;
  formula_name?: string;       // legacy alias
  formula_name_en?: string;    // server sends this (JOIN on formulas.name_en)
  formula_name_ar?: string;    // server sends this (JOIN on formulas.name_ar)
  selected_config_id: string | null;
  config_name: string | null;
  formula_version_snapshot: number;
  field_values: Record<string, number>;
  results: Record<string, number>;
  created_at: string;
  leaf_total: number;
  material_lines: RawMaterialLine[];
}

// 🤖 AI Assistant (Raw)
export interface AIQuestion {
  id: number;
  language: {
    en: string;
    ar: string;
  };
}

export interface AIExpertResponse {
  message: string;
  user_id?: string;
  display_location?: string;
}

export interface AIFAQResponse {
  id: number;
  question: { en: string; ar: string };
  answer: { en: string; ar: string };
  selectedLanguage: string;
  user_id?: string;
}

// 💳 Subscription (Raw)
// Matches server getMySubscriptionForClient response shape:
// { subscription_id, status, features_snapshot, plan: { name, price, duration }, billingCycle, period: { start, end } }
export interface RawSubscription {
  subscription_id?: string;
  status?: string;
  features_snapshot?: Record<string, any>;
  plan?: {
    name?: string;
    price?: number;
    duration?: number;
    type?: string;
    plan_type?: string;
  };
  billingCycle?: string;
  period?: {
    start?: string;
    end?: string;
  };
  // Legacy fields (kept for backward compat with older responses)
  plan_name?: string;
  plan_type?: string | null;
  subscription_status?: string;
  start_date?: string;
  end_date?: string;
  plan_id?: string | null;
  is_active?: boolean;
}

export interface RawUsage {
  subscription_id: string;
  plan_ends_at: string;
  usage: {
    projects: { used: number; limit: number | null; unlimited: boolean; percentage: number | null };
    ai: { used: number; limit: number | null; unlimited: boolean; percentage: number | null };
    estimations: { used: number; limit: number | null; unlimited: boolean; percentage: number | null };
  };
}

// 📋 Plans (Raw)
export interface RawPlan {
  plan_id: string;
  name_en: string;
  name_ar?: string;
  description_en?: string;
  description_ar?: string;
  price: number;
  duration: number;
  plan_type_id?: string;
  plan_type_name?: string;
  features?: RawPlanFeature[];
}

export interface RawPlanFeature {
  feature_key: string;
  feature_value: string | number | boolean;
}

export interface RawPlanType {
  plan_type_id: string;
  name_en: string;
  name_ar?: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// CLEAN DOMAIN TYPES — Frontend Models (camelCase, use in UI/hooks)
// ══════════════════════════════════════════════════════════════════════════════

// 🔐 User (Clean)
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'CLIENT' | 'ADMIN' | string;
  avatarUrl?: string;
  language?: 'en' | 'ar';
  status?: string;
  createdAt?: string;
}

// 🗂️ Category (Clean)
export interface Category {
  categoryId: string;
  parentId: string | null;
  categoryLevel: CategoryLevel;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  icon: string | null;
  sortOrder: number;
  children?: Category[];
}

export interface LeafDetail extends Category {
  formulas: Formula[];
  configs: MaterialConfig[];
}

export interface Formula {
  formulaId: string;
  nameEn: string;
  nameAr: string;
  expression: string;
  version: number;
  outputUnitSymbol: string;
  fields: FieldDefinition[];
}

export interface FieldDefinition {
  fieldId: string;
  label: string;
  labelAr: string;
  required: boolean;
  defaultValue: number | null;
  sortOrder: number;
  unitSymbol: string;
  isComputed: boolean;
}

export interface MaterialConfig {
  configId: string;
  name: string;
  description: string | null;
}

// 🧮 Calculation (Clean)
export interface MaterialLine {
  materialId: string;
  materialName: string;
  materialNameEn?: string;
  materialNameAr?: string;
  materialType: 'PRIMARY' | 'ACCESSORY';
  quantity: number;
  appliedWaste: number;
  quantityWithWaste: number;
  unitPriceSnapshot: number;
  wasteFactorSnapshot: number;
  subTotal: number;
  unitSymbol?: string;
}

export interface IntermediateResult {
  formulaId: string;
  formulaVersion: number;
  outputKey: string;
  outputLabel?: string;  // Display-only — derived from output_label or outputKey. NEVER used as a DB key.
  value: number;
  unitSymbol: string;
}

export interface CalculationResult {
  results: Record<string, number>;
  intermediateResults: IntermediateResult[];
  materialLines: MaterialLine[];
  totalCost: number;
}

// 📁 Project (Clean)
export interface Project {
  projectId: string;
  name: string;
  description: string | null;
  status: 'active' | 'completed';
  createdAt: string;
  estimationId: string;
  totalCost: number;
  leafCount: number;
  userId?: string;
  imageUrl?: string | null;
  budgetEstimation?: number;
  estimationStatus?: string;
  estimatedBudget?: number;
  lastCalculationId?: string;
  calculationStatus?: string;
  budgetCategory?: string | null;
}

export interface EstimationReport {
  estimationId: string;
  projectId: string;
  budgetType: string;
  totalBudget: number;
  totalCost?: number;
  leafCount?: number;
  createdAt: string;
  leafCalculations: SavedLeafCalculation[];
}

export interface SavedLeafCalculation {
  projectDetailsId: string;
  categoryId: string;
  categoryName: string;
  selectedFormulaId: string;
  formulaName: string;
  selectedConfigId: string | null;
  configName: string | null;
  formulaVersionSnapshot: number;
  fieldValues: Record<string, number>;
  results: Record<string, number>;
  createdAt: string;
  leafTotal: number;
  materialLines: MaterialLine[];
}

// 💳 Subscription (Clean)
export interface Subscription {
  planName: string;
  planType: string | null;
  subscriptionStatus: string;
  startDate: string;
  endDate: string;
  planId: string | null;
  isActive: boolean;
  features?: Record<string, any>;
}

export interface Usage {
  projectsLimit: { used: number; limit: number };
  aiUsageLimit: { used: number; limit: number };
  leafCalculationsLimit: { used: number; limit: number };
}

// 📋 Plan (Clean)
export interface Plan {
  planId: string;
  nameEn: string;
  nameAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  price: number;
  duration: number;
  planTypeId?: string;
  planTypeName?: string;
  features?: PlanFeature[];
}

export interface PlanFeature {
  featureKey: string;
  featureValue: string | number | boolean;
}

export interface PlanType {
  planTypeId: string;
  nameEn: string;
  nameAr?: string;
}


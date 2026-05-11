import axios from 'axios';
import type {
  RawProject,
  RawCategory,
  RawCalculationResult,
  RawEstimationReport,
  RawLeafDetail,
  RawUser,
  RawSubscription,
  RawUsage,
  RawPlan,
  Project,
  Category,
  LeafDetail,
  CalculationResult,
  EstimationReport,
  User,
  Subscription,
  Usage,
  Plan,
  CalculateRequest,
  CreateProjectRequest,
  AIQuestion,
  AIExpertResponse,
  AIFAQResponse,
} from './types';
import { MOCK_CATEGORIES, MOCK_PROJECTS } from './mockData';
import {
  mapProjectFromAPI,
  mapProjectsFromAPI,
  mapCategoriesFromAPI,
  mapCategoryFromAPI,
  mapCategoryTreeFromAPI,
  mapLeafDetailFromAPI,
  mapCalculationResultFromAPI,
  mapEstimationFromAPI,
  mapUserFromAPI,
  mapSubscriptionFromAPI,
  mapUsageFromAPI,
  mapPlansFromAPI,
  mapPlanFromAPI,
} from './mappers';
import { authService } from '~/services/authService';
import { logger } from '~/utils/errorHandler';
import { APP_CONFIG, STORAGE_KEYS } from '~/constants/config';
import { storage } from '~/utils/storage';
import { detectBaseUrl, resetCachedBaseUrl } from '~/utils/network';
import { showGlobalFeedback } from '~/context/FeedbackContext';

// Re-export authApi from its new location to maintain compatibility
export { authApi } from './authApi';

// ─── Base URL Resolution ──────────────────────────────────────────────────────
// Delegated to the shared network utility, which handles:
//   - custom server URL override (settings screen)
//   - production env URL (short-circuit)
//   - parallel probing of LAN candidates in development
//   - persistent caching of the winning URL
const getBaseUrl = (): Promise<string> => detectBaseUrl();

// ─── FormData uploads via fetch (axios fails in RN bridgeless mode) ──────────
// React Native's New Architecture (always-on in Expo Go) breaks axios's XHR
// FormData uploads when the body contains a file:// URI — the request hangs
// and surfaces as a generic "Network Error". The native fetch API handles
// this case correctly, so we route FormData POST/PUT through fetch and keep
// the same response-envelope unwrapping the axios interceptor uses.
export async function uploadFormData<T = unknown>(
    method: 'POST' | 'PUT' | 'PATCH',
    url: string,
    formData: FormData,
): Promise<T> {
    const baseUrl = await getBaseUrl();
    const fullUrl = `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
    const token = await authService.getValidToken();

    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    // IMPORTANT: never set Content-Type manually — fetch adds the correct
    // multipart/form-data boundary automatically.

    if (__DEV__) console.log(`[API] [${method}] (fetch) → ${fullUrl}`);

    const res = await fetch(fullUrl, { method, headers, body: formData as any });

    // Read once, parse defensively.
    const text = await res.text();
    let parsed: any = null;
    try { parsed = text ? JSON.parse(text) : null; } catch { parsed = text; }

    if (!res.ok) {
        const errMsg =
            parsed?.error?.message ||
            parsed?.message ||
            `Request failed with status ${res.status}`;
        if (__DEV__) {
            logger.error('API', `FAILURE [${method}] ${url} | Status: ${res.status}`);
        }
        throw {
            status: res.status,
            message: errMsg,
            code: parsed?.error?.code,
            data: parsed,
            isServerError: res.status >= 500,
            isSubscriptionError:
                res.status === 403 || parsed?.error?.code === 'NO_SUBSCRIPTION',
        };
    }

    // Mirror the axios response interceptor's envelope unwrapping
    if (parsed && parsed.status === 'ok' && 'data' in parsed) return parsed.data as T;
    if (parsed && parsed.success === true && 'data' in parsed) return parsed.data as T;
    return parsed as T;
}



// ─── Axios Instance ───────────────────────────────────────────────────────────

const api = axios.create({
    timeout: APP_CONFIG.API_TIMEOUT_MS,
    headers: {
        'Accept': 'application/json',
    },
});

// ─── Token Refresh Queue ──────────────────────────────────────────────────────
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
    refreshSubscribers.push(cb);
};

const onTokenRefreshed = (token: string) => {
    refreshSubscribers.map((cb) => cb(token));
    refreshSubscribers = [];
};

api.interceptors.request.use(async (config) => {
    // 1. Ensure baseURL is ALWAYS present.
    // If not set on the instance yet, resolve it and set it as default.
    if (!api.defaults.baseURL) {
        api.defaults.baseURL = await getBaseUrl();
    }
    config.baseURL = api.defaults.baseURL;
    
    // 2. MANDATORY: ALWAYS fetch the latest accessToken from storage BEFORE every request.
    const token = await authService.getValidToken();
    
    if (token) {
        const authHeader = `Bearer ${token}`;
        
        if (__DEV__) {
            console.log(`[API] [${config.method?.toUpperCase()}] ${config.url} | Header: Bearer ${token.substring(0, 15)}...`);
        }
        
        // FORCE HEADER OVERWRITE: 
        // We set it on config.headers to ensure this specific request uses the fresh token.
        if (config.headers && typeof config.headers.set === 'function') {
            config.headers.set('Authorization', authHeader);
        } else {
            (config.headers as any).Authorization = authHeader;
        }
    } else {
        // Clean up Authorization header for public requests
        if (config.headers) {
            if (typeof config.headers.delete === 'function') {
                config.headers.delete('Authorization');
            } else {
                delete config.headers.Authorization;
            }
        }
    }
    
    // 3. Handle Content-Type
    const isFormData = config.data instanceof FormData || (config.data && typeof config.data.append === 'function');
    
    if (isFormData) {
        // For FormData, we MUST NOT set Content-Type manually so Axios/Browser can add the boundary.
        if (config.headers && typeof config.headers.delete === 'function') {
            config.headers.delete('Content-Type');
        } else if (config.headers) {
            delete (config.headers as any)['Content-Type'];
            delete (config.headers as any)['content-type'];
        }
    } else if (config.data && !config.headers?.['Content-Type'] && !config.headers?.['content-type']) {
        // For JSON requests, add the header if data is present
        if (config.headers && typeof config.headers.set === 'function') {
            config.headers.set('Content-Type', 'application/json');
        } else if (config.headers) {
            (config.headers as any)['Content-Type'] = 'application/json';
        }
    }
    
    if (__DEV__) {
        console.log(`[API] Headers:`, JSON.stringify(config.headers));
        console.log(`[API] Data type:`, config.data instanceof FormData ? 'FormData' : typeof config.data);
    }
    
    console.log(`[API] [${config.method?.toUpperCase()}] → ${config.baseURL}${config.url}`);
    return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use(
    (response) => {
        // Unwrap { status: 'ok', data: ... } envelope (standard pattern)
        if (response.data && response.data.status === 'ok' && 'data' in response.data) {
            return response.data.data;
        }
        // Unwrap { success: true, data: ... } envelope (subscription endpoints use this)
        if (response.data && response.data.success === true && 'data' in response.data) {
            return response.data.data;
        }
        // Fallback: response already contains data directly
        return response.data;
    },
    async (error) => {
        const originalRequest = error.config;
        
        // 1. Detect Auth Failure
        let dataObj = error.response?.data;
        if (typeof dataObj === 'string') {
            try { dataObj = JSON.parse(dataObj); } catch (e) {}
        }
        
        const errorCode = dataObj?.error?.code;
        const errorMsg = dataObj?.error?.message || '';
        const is401 = error.response?.status === 401;
        
        // Server's checkSubscription uses wrong AppError arg order, so it sends
        // HTTP 500 with body { error: { code: 403, message: '...subscription...' } }.
        const isSubscriptionError =
            errorCode === 'NO_SUBSCRIPTION' ||
            error.response?.status === 403 ||
            (error.response?.status === 500 && (errorCode == 403 || errorMsg.toLowerCase().includes('subscription')));
        
        if (is401 && originalRequest && !originalRequest._retry) {
            
            if (isRefreshing) {
                return new Promise((resolve) => {
                    subscribeTokenRefresh((token) => {
                        // CLEAN REBUILD: Reconstruct request to avoid Axios internal corruption
                        const retryConfig = {
                            ...originalRequest,
                            _retry: true,
                            baseURL: api.defaults.baseURL // Explicitly restore baseURL
                        };

                        // Inject the fresh token directly into the retried request
                        const authHeader = `Bearer ${token}`;
                        if (retryConfig.headers && typeof retryConfig.headers.set === 'function') {
                            retryConfig.headers.set('Authorization', authHeader);
                        } else {
                            retryConfig.headers = {
                                ...(retryConfig.headers || {}),
                                'Authorization': authHeader
                            };
                        }

                        resolve(api(retryConfig));
                    });
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;
            
            return new Promise((resolve, reject) => {
                logger.info('API', `Auth failure (${error.response?.status}). Refreshing token...`);
                
                authService.refreshToken()
                    .then((newToken) => {
                        isRefreshing = false;
                        if (newToken) {
                            onTokenRefreshed(newToken);
                            
                            // CLEAN REBUILD: 
                            // Re-executing via api(config) will trigger the request interceptor,
                            // which will fetch the new token from storage and set the baseURL.
                            const retryConfig = {
                                ...originalRequest,
                                _retry: true,
                                baseURL: api.defaults.baseURL // Force consistency
                            };

                            // Use the fresh token for the immediate retry as well
                            const authHeader = `Bearer ${newToken}`;
                            if (retryConfig.headers && typeof retryConfig.headers.set === 'function') {
                                retryConfig.headers.set('Authorization', authHeader);
                            } else {
                                retryConfig.headers = {
                                    ...(retryConfig.headers || {}),
                                    'Authorization': authHeader
                                };
                            }

                            resolve(api(retryConfig));
                        } else {
                            throw new Error('Refresh failed - no token returned');
                        }
                    })
                    .catch(async (refreshError) => {
                        isRefreshing = false;
                        logger.error('API', 'Refresh flow failed definitively');
                        await authService.handleInvalidToken();
                        reject(error);
                    });
            });
        }

        // 2. Handle Non-Auth Errors
        const status = error.response?.status || 'Network Error';
        const method = originalRequest?.method?.toUpperCase() || 'UNKNOWN';
        const url = originalRequest?.url || 'unknown';

        let errorMessage = dataObj?.error?.message || error.message || 'Unknown network error';
        if (error.message === 'Network Error') {
            errorMessage = 'Could not reach the server. Please check your internet connection.';
            // Invalidate cached URL so the next request re-probes and can discover
            // a different server (e.g. local dev when production is down).
            api.defaults.baseURL = undefined;
            resetCachedBaseUrl().catch(() => {});
        }

        const apiError = {
            status,
            message: errorMessage,
            code: errorCode,  // e.g. 'NO_SUBSCRIPTION', 'TOKEN_EXPIRED'
            data: dataObj,
            isServerError: status === 500 || status === 'Network Error' || !error.response,
            isSubscriptionError: isSubscriptionError ?? false,
        };

        // ─── Global Smart Feedback Injection ───
        // Subscription-related endpoints handle their errors locally in useSubscription.
        // We must NOT show a global popup for expected 403/404 on these endpoints,
        // otherwise free-plan users see error popups every time they log in.
        const isSubscriptionEndpoint = url?.includes('/subscriptions/') || url?.includes('/projects');
        const isSilentSubscriptionError = isSubscriptionError && isSubscriptionEndpoint;
        
        if (status === 404) {
            console.log(`[API] 404 Not Found (Expected for new items): [${method}] ${url}`);
        } else if (isSilentSubscriptionError) {
            console.log(`[API] Subscription error on ${url} — handled silently by caller`);
        } else {
            logger.error('API', `FAILURE [${method}] ${url} | Status: ${status}`);
        }

        if (isSilentSubscriptionError) {
            // Handled above in the log
        } else if (isSubscriptionError) {
            // User-initiated action that requires subscription (e.g. create project, calculate)
            showGlobalFeedback({
                title: 'Subscription Required',
                message: errorMessage || 'This feature is only available for premium subscribers.',
                type: 'subscription',
                primaryText: 'View Plans'
            });
        } else if (status === 'Network Error') {
            showGlobalFeedback({
                title: 'Connection Issue',
                message: 'Please check your internet connection and try again.',
                type: 'network',
                primaryText: 'Retry'
            });
        } else if (status === 401) {
            // Refresh flow handled most cases, but if we are here, it failed definitively
            showGlobalFeedback({
                title: 'Session Expired',
                message: 'Your session has ended. Please log in again.',
                type: 'error',
                primaryText: 'Login'
            });
        } else if (status === 400) {
            showGlobalFeedback({
                title: 'Invalid Request',
                message: errorMessage || 'Please check your input and try again.',
                type: 'warning',
                primaryText: 'OK'
            });
        } else if (status === 404) {
            // 404 is expected for new accounts / empty data — do NOT show popup
            console.log(`[API] 404 suppressed for ${url}`);
        } else if (status >= 500) {
            showGlobalFeedback({
                title: 'Server Error',
                message: 'Something went wrong on our end. We are looking into it.',
                type: 'error',
                primaryText: 'OK'
            });
        } else {
            // Fallback for other errors (403 forbidden for role check, etc)
            showGlobalFeedback({
                title: 'Action Failed',
                message: errorMessage || `An error occurred (Status: ${status})`,
                type: 'error',
                primaryText: 'OK'
            });
        }

        return Promise.reject(apiError);
    }
);



// ─── Resilience Wrapper ───────────────────────────────────────────────────────

/**
 * Wraps an API call with an automatic fallback mechanism.
 * If the API fails with a server error, it returns the provided fallback data.
 */
async function withFallback<T>(promise: Promise<T>, fallback: T): Promise<T> {
    try {
        return await promise;
    } catch (error: any) {
        // Don't mask subscription errors — let the caller handle them properly
        if (error.isSubscriptionError) {
            throw error;
        }
        if (error.isServerError) {
            console.warn('[API] Server failure detected. Using fallback data.');
            return fallback;
        }
        throw error;
    }
}


// ─── Shared APIs ──────────────────────────────────────────────────────────────

export const usersApi = {
    getProfile: async (): Promise<User> => {
        const raw: RawUser = await api.get('/me');
        return mapUserFromAPI(raw);
    },
};

export const chatApi = {
    getRecommendedQuestions: (location: string): Promise<{ questions: AIQuestion[] }> =>
        api.post('/ai/questions', { display_location: location }),
    sendMessage: (message: string): Promise<AIExpertResponse> =>
        api.post('/ai/expert', { user_message: message }),
    getFAQAnswer: (questionId: number, language: string = 'en'): Promise<AIFAQResponse> =>
        api.post(`/ai/faq/${questionId}`, { language }),
};

export const estimationApi = {
    // ── Categories ────────────────────────────────────────────────────────────
    getCategories: async (): Promise<Category[]> => {
        const raw = await withFallback<RawCategory[]>(api.get('/categories'), MOCK_CATEGORIES);
        return mapCategoriesFromAPI(raw);
    },
    getCategoryTree: async (): Promise<Category[]> => {
        const raw: RawCategory[] = await api.get('/categories/tree');
        return mapCategoryTreeFromAPI(raw);
    },
    getCategoryChildren: async (id: string): Promise<Category[]> => {
        const raw: RawCategory[] = await api.get(`/categories/${id}/children`);
        return mapCategoriesFromAPI(raw);
    },
    getCategoryLeaf: async (id: string): Promise<LeafDetail> => {
        const raw: RawLeafDetail = await api.get(`/categories/${id}/leaf`);
        return mapLeafDetailFromAPI(raw);
    },

 // ── Projects ──────────────────────────────────────────────────────────────
listProjects: async (): Promise<Project[]> => {
    const raw = await withFallback<RawProject[]>(api.get('/projects'), MOCK_PROJECTS);
    return mapProjectsFromAPI(raw);
},

// NOTE: uploadProjectImage removed — server handles image upload via multer
// directly in POST /projects. Use createProject with FormData instead.

getProject: async (id: string): Promise<Project> => {
    const raw: RawProject = await api.get(`/projects/${id}`);
    return mapProjectFromAPI(raw);
},

createProject: async (data: CreateProjectRequest | FormData): Promise<Project> => {
    let raw: RawProject;
    if (data instanceof FormData) {
        // Use fetch (not axios) — axios's XHR layer hangs on file:// URIs
        // when RN's New Architecture / Bridgeless mode is enabled.
        raw = await uploadFormData<RawProject>('POST', '/projects', data);
    } else {
        raw = await api.post('/projects', data);
    }
    return mapProjectFromAPI(raw);
},

    // ── Estimation ────────────────────────────────────────────────────────────
    getProjectEstimation: async (id: string): Promise<EstimationReport | null> => {
        try {
            const raw: RawEstimationReport = await api.get(`/projects/${id}/estimation`);
            return mapEstimationFromAPI(raw);
        } catch {
            return null;
        }
    },

    // ── Calculation ───────────────────────────────────────────────────────────
    calculatePreview: async (data: CalculateRequest): Promise<CalculationResult> => {
        const raw: RawCalculationResult = await api.post('/calculate', data);
        return mapCalculationResultFromAPI(raw);
    },

    // ── Leaf operations (payloads stay snake_case to match backend schema) ───
    saveLeaf: (data: any) => api.post('/estimation/save-leaf', data),
    deleteLeaf: (projectDetailsId: string) => api.delete('/estimation/leaf', { data: { project_details_id: projectDetailsId } }),

    // ── Export ─────────────────────────────────────────────────────────────
    exportProject: async (id: string): Promise<{ success: boolean; message?: string }> => {
        return api.get(`/projects/${id}/export`);
    },
};

// ─── Subscription APIs ────────────────────────────────────────────────────────

export const subscriptionApi = {
    getMine: async (): Promise<Subscription> => {
        const raw: RawSubscription = await api.get('/subscriptions/me');
        return mapSubscriptionFromAPI(raw);
    },
    getUsage: async (): Promise<Usage> => {
        const raw: RawUsage = await api.get('/subscriptions/me/usage');
        return mapUsageFromAPI(raw);
    },
    create: async (planId: string): Promise<any> => {
        try {
            return await api.post('/subscriptions', { planId });
        } catch (err: any) {
            if (err?.status === 409 || err?.response?.status === 409) {
                console.log("[SubscriptionAPI] 409 Conflict: Subscription exists, returning existing subscription.");
                return await subscriptionApi.getMine();
            }
            throw err;
        }
    },
    switchPlan: (planId: string): Promise<any> =>
        api.patch('/subscriptions/switch', { newPlanId: planId }),
    confirmSwitchPlan: (confirmationToken: string): Promise<any> =>
        api.post('/subscriptions/switch/confirm', { confirmationToken }),
};

// ─── Plans APIs ───────────────────────────────────────────────────────────────

export const plansApi = {
    getAll: async (): Promise<Plan[]> => {
        const raw: RawPlan[] = await api.get('/plans');
        return mapPlansFromAPI(raw);
    },
    getFeatures: async (id: string): Promise<any> => {
        return api.get(`/plans/${id}`);
    },
};

export default api;

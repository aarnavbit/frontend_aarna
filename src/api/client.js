/**
 * Public and Reviewer API client for the AARNA recruitment portal.
 * Handles backend communication with automated offline localStorage mock fallback.
 */

/**
 * Resolves the active backend API base URL from Vite environment or runtime hostname.
 * @returns {string}
 */
export function resolveApiUrl() {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '')
  }
  if (typeof window !== 'undefined' && window.location && window.location.origin && !window.location.origin.includes('file://')) {
    return window.location.origin.replace(/\/+$/, '')
  }
  return 'http://localhost:8000'
}

export const API_BASE_URL = resolveApiUrl()

const LOCAL_STORAGE_KEY = 'aarana_mock_applications'

/**
 * Retrieves mock application records from local storage.
 * @returns {Array<Object>}
 */
export function getLocalApplications() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

/**
 * Saves a new application record to local storage mock storage.
 * @param {Object} app - Application payload
 * @returns {Object} Saved application record with metadata
 */
export function saveLocalApplication(app) {
  const apps = getLocalApplications()
  const randomSuffix = Math.random().toString(36).slice(2, 6)
  const newApp = {
    id: `app_${Date.now()}_${randomSuffix}`,
    created_at: new Date().toISOString(),
    status: 'pending',
    ...app,
  }
  apps.unshift(newApp)
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(apps))
  } catch {
    // Storage quota exceeded or storage disabled
  }
  return newApp
}

/**
 * Generic HTTP request helper with error normalization and offline fallback.
 * @param {string} path - Request endpoint path
 * @param {Object} [options={}] - Fetch options and token
 * @returns {Promise<any>}
 */
async function request(path, options = {}) {
  const { token, ...fetchOptions } = options
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...fetchOptions,
      headers: {
        Accept: 'application/json',
        ...(fetchOptions.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...fetchOptions.headers,
      },
    })
    const body = await response.json().catch(() => null)
    if (!response.ok) {
      const errorMsg = body?.detail || body?.error?.message || body?.report || 'We could not complete that request.'
      const error = new Error(errorMsg)
      error.code = body?.error?.code
      error.fields = body?.error?.fields || {}
      error.status = response.status
      throw error
    }
    return body
  } catch (networkError) {
    // If backend server is unreachable (e.g. offline fallback), fallback to local storage mock
    if (networkError instanceof TypeError || networkError.message === 'Failed to fetch') {
      if (path === '/applications' && fetchOptions.method === 'POST') {
        const payload = JSON.parse(fetchOptions.body || '{}')
        const created = saveLocalApplication(payload)
        return { success: true, application: created, is_mock: true }
      }
      if (path === '/admin/session' && fetchOptions.method === 'POST') {
        return { token: `mock_session_token_${Date.now()}` }
      }
      if (path.startsWith('/admin/applications')) {
        const items = getLocalApplications()
        return { items, count: items.length, total: items.length }
      }
      if (path === '/admin/sync-status') {
        return { status: 'standalone_mock', synced_at: new Date().toISOString() }
      }
    }
    throw networkError
  }
}

export const api = {
  /**
   * Submits applicant registration data.
   * @param {Object} payload
   */
  submitApplication: (payload) =>
    request('/applications', { method: 'POST', body: JSON.stringify(payload) }),

  /**
   * Authenticates reviewer session via password.
   * @param {string} password
   */
  createReviewerSession: (password) =>
    request('/admin/session', { method: 'POST', body: JSON.stringify({ password }) }),

  /**
   * Alias for createReviewerSession to satisfy alternate interface contracts.
   * @param {string} secret
   */
  adminSession: (secret) =>
    request('/admin/session', { method: 'POST', body: JSON.stringify({ password: secret }) }),

  /**
   * Fetches paginated applications for reviewer dashboard.
   * @param {string} token - Reviewer Bearer token
   * @param {Object} [query={}] - Query filters (limit, offset, etc.)
   */
  getApplications: (token, query = {}) => {
    const searchParams = new URLSearchParams(query)
    const queryString = searchParams.toString()
    const endpoint = queryString ? `/admin/applications?${queryString}` : '/admin/applications'
    return request(endpoint, { token })
  },

  /**
   * Fetches database synchronization status.
   * @param {string} token - Reviewer Bearer token
   */
  getSyncStatus: (token) => request('/admin/sync-status', { token }),

  /**
   * Fire-and-forget backend health ping to wake server instances.
   */
  wakeup: () => fetch(`${API_BASE_URL}/applications`, { method: 'OPTIONS' }).catch(() => null),
}


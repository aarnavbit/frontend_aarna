const configuredUrl = import.meta.env.VITE_API_BASE_URL || '/api'
const API_BASE_URL = configuredUrl.replace(/\/$/, '')

const LOCAL_STORAGE_KEY = 'aarana_mock_applications'

function getLocalApplications() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function saveLocalApplication(app) {
  const apps = getLocalApplications()
  const newApp = {
    id: 'app_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    created_at: new Date().toISOString(),
    status: 'pending',
    ...app,
  }
  apps.unshift(newApp)
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(apps))
  } catch {
    // Storage quota or disabled
  }
  return newApp
}

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
      const error = new Error(body?.error?.message || 'We could not complete that request.')
      error.code = body?.error?.code
      error.fields = body?.error?.fields || {}
      error.status = response.status
      throw error
    }
    return body
  } catch (networkError) {
    // If backend server is unreachable (e.g. backend server not running), fallback to local storage mock
    if (networkError instanceof TypeError || networkError.message === 'Failed to fetch') {
      if (path === '/applications' && fetchOptions.method === 'POST') {
        const payload = JSON.parse(fetchOptions.body || '{}')
        const created = saveLocalApplication(payload)
        return { success: true, application: created, is_mock: true }
      }
      if (path === '/admin/session' && fetchOptions.method === 'POST') {
        return { token: 'mock_session_token_' + Date.now() }
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
  submitApplication: (payload) =>
    request('/applications', { method: 'POST', body: JSON.stringify(payload) }),
  createReviewerSession: (password) =>
    request('/admin/session', { method: 'POST', body: JSON.stringify({ password }) }),
  getApplications: (token, query) =>
    request(`/admin/applications?${new URLSearchParams(query)}`, { token }),
  getSyncStatus: (token) => request('/admin/sync-status', { token }),
  wakeup: () => fetch(`${API_BASE_URL}/applications`, { method: 'OPTIONS' }).catch(() => null),
}

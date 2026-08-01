/** JSON API client shared by the application form and private reviewer dashboard. */

const configuredUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000/api'
const API_BASE_URL = configuredUrl.replace(/\/$/, '')

async function request(path, options = {}) {
  const { token, ...fetchOptions } = options
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
}

export const api = {
  submitApplication: (payload) =>
    request('/applications', { method: 'POST', body: JSON.stringify(payload) }),
  createReviewerSession: (password) =>
    request('/admin/session', { method: 'POST', body: JSON.stringify({ password }) }),
  getApplications: (token, query) =>
    request(`/admin/applications?${new URLSearchParams(query)}`, { token }),
  getSyncStatus: (token) => request('/admin/sync-status', { token }),
}

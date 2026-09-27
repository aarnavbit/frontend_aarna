/**
 * Ishanya event registration API client.
 */

/**
 * Resolves the Ishanya API base URL.
 * @returns {string}
 */
function resolveBase() {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '')
  }
  if (typeof window !== 'undefined' && window.location?.origin && !window.location.origin.includes('file://')) {
    return window.location.origin.replace(/\/+$/, '')
  }
  return 'http://localhost:8000'
}

const BASE = resolveBase() + '/api/ishanya'

/**
 * Builds authorization headers using stored admin JWT token.
 * @returns {Record<string, string>}
 */
function getAuthHeaders() {
  try {
    const token = localStorage.getItem('aarna_admin_token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  } catch {
    return {}
  }
}

/**
 * Handles HTTP response validation and error translation.
 * @param {Response} response
 * @returns {Promise<any>}
 */
async function handleResponse(response) {
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const errorMsg =
      data.detail ||
      data.message ||
      data.error ||
      'An error occurred'
    const error = new Error(errorMsg)
    error.status = response.status
    error.data = data
    throw error
  }
  return data
}

export const ishanyaApi = {
  /**
   * Register a new team.
   */
  register: async (payload) => {
    const res = await fetch(`${BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return handleResponse(res)
  },

  /**
   * Submit payment details (UTR + optional screenshot).
   */
  submitPayment: async (payload) => {
    const res = await fetch(`${BASE}/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return handleResponse(res)
  },

  /**
   * Get team status by registration ID.
   */
  getStatus: async (registrationId) => {
    const res = await fetch(`${BASE}/status/${registrationId}`)
    return handleResponse(res)
  },

  /**
   * Update team members (only when status is pending).
   */
  updateMembers: async (registrationId, payload) => {
    const res = await fetch(`${BASE}/members/${registrationId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return handleResponse(res)
  },

  /**
   * Admin: list all teams.
   */
  getTeams: async () => {
    const res = await fetch(`${BASE}/admin/teams`, {
      headers: { ...getAuthHeaders() },
    })
    return handleResponse(res)
  },

  /**
   * Admin: update team status (accept/reject).
   */
  updateTeamStatus: async (registrationId, payload) => {
    const res = await fetch(`${BASE}/admin/teams/${registrationId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(payload),
    })
    return handleResponse(res)
  },

  /**
   * Admin: get payment screenshot.
   */
  getScreenshot: async (registrationId) => {
    const res = await fetch(`${BASE}/admin/teams/${registrationId}/screenshot`, {
      headers: { ...getAuthHeaders() },
    })
    return handleResponse(res)
  },
}

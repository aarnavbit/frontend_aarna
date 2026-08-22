/**
 * Administrative API client for Super Admin and Sub-Admin role management,
 * applicant review, and portal administration.
 */

/**
 * Resolves the admin backend endpoint from environment or window location.
 * @returns {string}
 */
export function resolveAdminBase() {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ADMIN_API_BASE_URL) {
    return import.meta.env.VITE_ADMIN_API_BASE_URL.replace(/\/+$/, '')
  }
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, '').replace(/\/+$/, '') + '/admin'
  }
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:8000/admin'
  }
  return 'https://backend-aarna.onrender.com/admin'
}

export const API_BASE = resolveAdminBase()

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
    if (response.status === 401) {
      try {
        localStorage.removeItem('aarna_admin_token')
        localStorage.removeItem('aarna_admin_info')
      } catch {
        // Safe fallback
      }
    }
    const errorMsg =
      data.report ||
      data.detail ||
      data.error?.message ||
      (typeof data.error === 'string' ? data.error : null) ||
      'An error occurred during request.'
    const error = new Error(errorMsg)
    error.status = response.status
    error.data = data
    throw error
  }
  return data
}

export const adminApi = {
  /**
   * Authenticates admin / sub-admin credentials.
   * @param {string} rollnumber
   * @param {string} password
   */
  login: async (rollnumber, password) => {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rollnumber, password }),
    })
    const data = await handleResponse(res)
    if (data.token) {
      try {
        localStorage.setItem('aarna_admin_token', data.token)
        if (data.admin) {
          localStorage.setItem('aarna_admin_info', JSON.stringify(data.admin))
        }
      } catch {
        // Storage quota fallback
      }
    }
    return data
  },

  /**
   * Fetches current authenticated admin profile.
   */
  getMe: async () => {
    const res = await fetch(`${API_BASE}/me`, {
      headers: { ...getAuthHeaders() },
    })
    return handleResponse(res)
  },

  /**
   * Fetches all registered applicants for admin dashboard review.
   */
  getApplicants: async () => {
    const res = await fetch(`${API_BASE}/applicants`, {
      headers: { ...getAuthHeaders() },
    })
    return handleResponse(res)
  },

  /**
   * Creates a new sub-admin account (Super Admin privilege).
   * @param {Object} payload
   */
  createSubAdmin: async (payload) => {
    const res = await fetch(`${API_BASE}/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(payload),
    })
    return handleResponse(res)
  },

  /**
   * Fetches all existing sub-admin accounts.
   */
  getSubAdmins: async () => {
    const res = await fetch(`${API_BASE}/subadmins`, {
      headers: { ...getAuthHeaders() },
    })
    return handleResponse(res)
  },

  /**
   * Logs out the current admin session and purges local credentials.
   */
  logout: () => {
    try {
      localStorage.removeItem('aarna_admin_token')
      localStorage.removeItem('aarna_admin_info')
    } catch {
      // Safe fallback
    }
  },

  /**
   * Retrieves parsed admin profile from local cache.
   * @returns {Object|null}
   */
  getStoredAdmin: () => {
    try {
      return JSON.parse(localStorage.getItem('aarna_admin_info'))
    } catch {
      return null
    }
  },
}


function resolveAdminBase() {
  if (import.meta.env.VITE_ADMIN_API_BASE_URL) {
    return import.meta.env.VITE_ADMIN_API_BASE_URL.replace(/\/+$/, '')
  }
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, '').replace(/\/+$/, '') + '/admin'
  }
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:8000/admin'
  }
  return 'https://backend-aarna.onrender.com/admin'
}

const API_BASE = resolveAdminBase()

function getAuthHeaders() {
  const token = localStorage.getItem('aarna_admin_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function handleResponse(response) {
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('aarna_admin_token')
      localStorage.removeItem('aarna_admin_info')
    }
    const errorMsg = data.report || data.detail || data.error?.message || (typeof data.error === 'string' ? data.error : null) || 'An error occurred during request.'
    const error = new Error(errorMsg)
    error.status = response.status
    error.data = data
    throw error
  }
  return data
}

export const adminApi = {
  login: async (rollnumber, password) => {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rollnumber, password })
    })
    const data = await handleResponse(res)
    if (data.token) {
      localStorage.setItem('aarna_admin_token', data.token)
      localStorage.setItem('aarna_admin_info', JSON.stringify(data.admin))
    }
    return data
  },

  getMe: async () => {
    const res = await fetch(`${API_BASE}/me`, {
      headers: { ...getAuthHeaders() }
    })
    return handleResponse(res)
  },

  getApplicants: async () => {
    const res = await fetch(`${API_BASE}/applicants`, {
      headers: { ...getAuthHeaders() }
    })
    return handleResponse(res)
  },

  createSubAdmin: async (payload) => {
    const res = await fetch(`${API_BASE}/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(payload)
    })
    return handleResponse(res)
  },

  getSubAdmins: async () => {
    const res = await fetch(`${API_BASE}/subadmins`, {
      headers: { ...getAuthHeaders() }
    })
    return handleResponse(res)
  },

  logout: () => {
    localStorage.removeItem('aarna_admin_token')
    localStorage.removeItem('aarna_admin_info')
  },

  getStoredAdmin: () => {
    try {
      return JSON.parse(localStorage.getItem('aarna_admin_info'))
    } catch {
      return null
    }
  }
}

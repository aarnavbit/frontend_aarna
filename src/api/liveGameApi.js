import { io } from 'socket.io-client'

export function getLiveBackendBase() {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '')
  }
  if (typeof window !== 'undefined' && window.location && window.location.origin && !window.location.origin.includes('file://')) {
    return window.location.origin.replace(/\/+$/, '')
  }
  return 'http://localhost:8000'
}

export const liveGameApi = {
  getBaseUrl: getLiveBackendBase,

  connectSocket: () => {
    const url = getLiveBackendBase()
    return io(url, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 20,
      reconnectionDelay: 1000
    })
  },

  getScores: async (adminPassword) => {
    const base = getLiveBackendBase()
    const headers = {}
    if (adminPassword) {
      headers['x-admin-password'] = adminPassword
    }

    const endpoint = adminPassword ? `${base}/api/admin/scores` : `${base}/api/games/leaderboard?limit=100`
    const res = await fetch(endpoint, { headers })
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      throw new Error(errData.detail || 'Failed to fetch live scores')
    }
    const data = await res.json()
    if (Array.isArray(data)) {
      const sorted = [...data].sort((a, b) => {
        const scoreA = Number(a.score ?? 0)
        const scoreB = Number(b.score ?? 0)
        if (scoreB !== scoreA) return scoreB - scoreA
        const timeA = Number(a.durationMs ?? a.duration_ms ?? Infinity)
        const timeB = Number(b.durationMs ?? b.duration_ms ?? Infinity)
        return timeA - timeB
      })
      return {
        players: sorted.map((p, idx) => ({ ...p, rank: idx + 1 })),
        stats: {
          totalPlayers: sorted.length,
          highestScore: sorted[0]?.score || 0,
          avgDurationSec: sorted.length ? Math.round((sorted.reduce((a, b) => a + (b.durationMs || b.duration_ms || 0), 0) / sorted.length) / 1000) : 0
        }
      }
    }
    if (data && Array.isArray(data.players)) {
      data.players.sort((a, b) => {
        const scoreA = Number(a.score ?? 0)
        const scoreB = Number(b.score ?? 0)
        if (scoreB !== scoreA) return scoreB - scoreA
        const timeA = Number(a.durationMs ?? a.duration_ms ?? Infinity)
        const timeB = Number(b.durationMs ?? b.duration_ms ?? Infinity)
        return timeA - timeB
      })
      data.players.forEach((p, idx) => { p.rank = idx + 1 })
    }
    return data
  },

  adminLogin: async (password) => {
    const base = getLiveBackendBase()
    const res = await fetch(`${base}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    })
    if (!res.ok) {
      throw new Error('Invalid host admin password')
    }
    return res.json()
  },

  startGame: async (adminPassword, roundNumber = null) => {
    const base = getLiveBackendBase()
    const res = await fetch(`${base}/api/admin/game/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': adminPassword
      },
      body: JSON.stringify(roundNumber ? { roundNumber: Number(roundNumber), round_number: Number(roundNumber) } : {})
    })
    if (!res.ok) throw new Error('Failed to start round')
    return res.json()
  },

  stopGame: async (adminPassword) => {
    const base = getLiveBackendBase()
    const res = await fetch(`${base}/api/admin/game/stop`, {
      method: 'POST',
      headers: { 'x-admin-password': adminPassword }
    })
    if (!res.ok) throw new Error('Failed to stop round')
    return res.json()
  },

  resetLobby: async (adminPassword) => {
    const base = getLiveBackendBase()
    const res = await fetch(`${base}/api/admin/game/reset-lobby`, {
      method: 'POST',
      headers: { 'x-admin-password': adminPassword }
    })
    if (!res.ok) throw new Error('Failed to reset lobby')
    return res.json()
  },

  resetAllData: async (adminPassword) => {
    const base = getLiveBackendBase()
    const res = await fetch(`${base}/api/admin/reset`, {
      method: 'POST',
      headers: { 'x-admin-password': adminPassword }
    })
    if (!res.ok) throw new Error('Failed to reset all data')
    return res.json()
  },

  exportCsv: async (adminPassword) => {
    const base = getLiveBackendBase()
    const res = await fetch(`${base}/api/admin/export-csv`, {
      headers: { 'x-admin-password': adminPassword }
    })
    if (!res.ok) throw new Error('Failed to download CSV')
    const blob = await res.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = `aarna_leaderboard_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }
}

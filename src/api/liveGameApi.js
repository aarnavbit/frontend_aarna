import { io } from 'socket.io-client'

/**
 * Socket.IO and REST telemetry client for the AARNA Live Arena and Host Control console.
 *
 * Supported Socket Events:
 * - 'game_state': Emitted when host updates round/stage state
 * - 'game_started': Emitted when a round begins
 * - 'game_ended': Emitted when host stops or terminates a round
 * - 'leaderboard_update': Emitted when scores change or players finish
 * - 'leaderboard_reset': Emitted when host resets leaderboard scores
 */

/**
 * Resolves the live backend base URL from Vite environment or runtime hostname.
 * @returns {string}
 */
export function getLiveBackendBase() {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '')
  }
  if (typeof window !== 'undefined' && window.location && window.location.origin && !window.location.origin.includes('file://')) {
    return window.location.origin.replace(/\/+$/, '')
  }
  return 'http://localhost:8000'
}

export const liveGameApi = {
  /**
   * Returns current backend base URL.
   */
  getBaseUrl: getLiveBackendBase,

  /**
   * Initializes a Socket.IO client instance with WebSocket and polling fallbacks.
   * @returns {import('socket.io-client').Socket}
   */
  connectSocket: () => {
    const url = getLiveBackendBase()
    return io(url, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
    })
  },

  /**
   * Fetches leaderboard rankings with optional host authentication.
   * Sorts players by duration and computes live arena summary statistics.
   *
   * @param {string} [adminPassword] - Optional host master key
   * @returns {Promise<{ players: Array<Object>, stats?: { totalPlayers: number, highestScore: number, avgDurationSec: number } }>}
   */
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
          avgDurationSec: sorted.length
            ? Math.round(
                sorted.reduce((a, b) => a + (b.durationMs || b.duration_ms || 0), 0) /
                  sorted.length /
                  1000
              )
            : 0,
        },
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
      data.players.forEach((p, idx) => {
        p.rank = idx + 1
      })
    }
    return data
  },

  /**
   * Verifies host password credentials.
   * @param {string} password
   */
  adminLogin: async (password) => {
    const base = getLiveBackendBase()
    const res = await fetch(`${base}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (!res.ok) {
      throw new Error('Invalid host admin password')
    }
    return res.json()
  },

  /**
   * Broadcasts round start command to all connected arena players.
   * @param {string} adminPassword
   * @param {number|string} [roundNumber=null]
   */
  startGame: async (adminPassword, roundNumber = null) => {
    const base = getLiveBackendBase()
    const res = await fetch(`${base}/api/admin/game/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': adminPassword,
      },
      body: JSON.stringify(
        roundNumber ? { roundNumber: Number(roundNumber), round_number: Number(roundNumber) } : {}
      ),
    })
    if (!res.ok) throw new Error('Failed to start round')
    return res.json()
  },

  /**
   * Signals current live round stop/termination.
   * @param {string} adminPassword
   */
  stopGame: async (adminPassword) => {
    const base = getLiveBackendBase()
    const res = await fetch(`${base}/api/admin/game/stop`, {
      method: 'POST',
      headers: { 'x-admin-password': adminPassword },
    })
    if (!res.ok) throw new Error('Failed to stop round')
    return res.json()
  },

  /**
   * Resets active game lobby to waiting state.
   * @param {string} adminPassword
   */
  resetLobby: async (adminPassword) => {
    const base = getLiveBackendBase()
    const res = await fetch(`${base}/api/admin/game/reset-lobby`, {
      method: 'POST',
      headers: { 'x-admin-password': adminPassword },
    })
    if (!res.ok) throw new Error('Failed to reset lobby')
    return res.json()
  },

  /**
   * Purges all leaderboard scores and session records on server.
   * @param {string} adminPassword
   */
  resetAllData: async (adminPassword) => {
    const base = getLiveBackendBase()
    const res = await fetch(`${base}/api/admin/reset`, {
      method: 'POST',
      headers: { 'x-admin-password': adminPassword },
    })
    if (!res.ok) throw new Error('Failed to reset all data')
    return res.json()
  },

  /**
   * Generates and downloads a CSV export file of active rankings.
   * @param {string} adminPassword
   */
  exportCsv: async (adminPassword) => {
    const base = getLiveBackendBase()
    const res = await fetch(`${base}/api/admin/export-csv`, {
      headers: { 'x-admin-password': adminPassword },
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
  },
}


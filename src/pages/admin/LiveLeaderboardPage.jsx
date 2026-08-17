import React, { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy, Flame, Users, Clock, Play, Square, RefreshCw,
  Download, Maximize2, Minimize2, Radio, Zap, Shield,
  Crown, Medal, Sparkles, CheckCircle, AlertTriangle, ArrowLeft,
  ExternalLink, Lock, CheckCircle2
} from 'lucide-react'
import { liveGameApi } from '../../api/liveGameApi'
import { useNavigate } from 'react-router-dom'
import '../AudienceDisplayPage.css'

export function LiveLeaderboardPage() {
  const [players, setPlayers] = useState([])
  const [stats, setStats] = useState({ totalPlayers: 0, highestScore: 0, avgDurationSec: 0 })
  const [gameState, setGameState] = useState({ status: 'waiting', roundNumber: 1 })
  const [connected, setConnected] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [adminPassword, setAdminPassword] = useState(() => localStorage.getItem('aarna_game_admin_pwd') || '')
  const [isHostUnlocked, setIsHostUnlocked] = useState(() => !!localStorage.getItem('aarna_game_admin_pwd'))
  const [passwordInput, setPasswordInput] = useState('')
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [actionLoading, setActionLoading] = useState('')
  const [toastMessage, setToastMessage] = useState('')
  const [lastSyncTime, setLastSyncTime] = useState(null)

  const socketRef = useRef(null)
  const navigate = useNavigate()

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 4000)
  }

  // Fetch Latest Scores & Stats
  const fetchScores = async () => {
    try {
      const data = await liveGameApi.getScores(isHostUnlocked ? adminPassword : null)
      if (data && data.players) {
        setPlayers(data.players)
      } else if (Array.isArray(data)) {
        setPlayers(data)
      }
      if (data && data.stats) {
        setStats(data.stats)
      }
      if (data && data.gameState) {
        setGameState(data.gameState)
      }
      setLastSyncTime(new Date())
    } catch (err) {
      console.warn('[Admin Live View] Error syncing scores:', err.message)
    }
  }

  // Socket.IO Setup
  useEffect(() => {
    const socket = liveGameApi.connectSocket()
    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      fetchScores()
    })

    socket.on('disconnect', () => {
      setConnected(false)
    })

    socket.on('game_state', (state) => {
      if (state) setGameState(state)
    })

    socket.on('game_started', (state) => {
      if (state) setGameState(state)
      fetchScores()
      showToast(`🚀 ROUND #${state?.roundNumber || 1} STARTED!`)
    })

    socket.on('game_ended', (state) => {
      if (state) setGameState(state)
      fetchScores()
      showToast('🛑 ROUND COMPLETED / STOPPED')
    })

    socket.on('leaderboard_update', () => {
      fetchScores()
    })

    socket.on('leaderboard_reset', () => {
      fetchScores()
      showToast('🔄 Leaderboard reset to initial state.')
    })

    // Initial fetch
    fetchScores()

    // Backup polling every 3.5 seconds
    const interval = setInterval(fetchScores, 3500)

    return () => {
      clearInterval(interval)
      socket.disconnect()
    }
  }, [isHostUnlocked, adminPassword])

  // Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {})
    }
  }

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  // Host Action Handlers
  const handleHostLogin = async (e) => {
    e.preventDefault()
    if (!passwordInput) return
    try {
      await liveGameApi.adminLogin(passwordInput)
      setAdminPassword(passwordInput)
      setIsHostUnlocked(true)
      localStorage.setItem('aarna_game_admin_pwd', passwordInput)
      setShowPasswordModal(false)
      showToast('✨ Host Admin Controls Unlocked!')
      fetchScores()
    } catch (err) {
      showToast('❌ Incorrect Host Password')
    }
  }

  const handleStartRound = async () => {
    setActionLoading('start')
    try {
      await liveGameApi.startGame(adminPassword)
      showToast('🚀 Game round launched!')
      fetchScores()
    } catch (err) {
      showToast(`❌ Error: ${err.message}`)
    } finally {
      setActionLoading('')
    }
  }

  const handleStopRound = async () => {
    setActionLoading('stop')
    try {
      await liveGameApi.stopGame(adminPassword)
      showToast('🛑 Game round ended!')
      fetchScores()
    } catch (err) {
      showToast(`❌ Error: ${err.message}`)
    } finally {
      setActionLoading('')
    }
  }

  const handleResetLobby = async () => {
    setActionLoading('resetLobby')
    try {
      await liveGameApi.resetLobby(adminPassword)
      showToast('🔄 Lobby reset. Ready for next round!')
      fetchScores()
    } catch (err) {
      showToast(`❌ Error: ${err.message}`)
    } finally {
      setActionLoading('')
    }
  }

  const handleClearScores = async () => {
    if (!window.confirm('⚠️ Are you sure you want to permanently clear all scores on the leaderboard?')) return
    setActionLoading('clear')
    try {
      await liveGameApi.resetAllData(adminPassword)
      showToast('🗑️ All leaderboard data cleared.')
      fetchScores()
    } catch (err) {
      showToast(`❌ Error: ${err.message}`)
    } finally {
      setActionLoading('')
    }
  }

  const handleExportCsv = async () => {
    try {
      await liveGameApi.exportCsv(adminPassword)
      showToast('📥 CSV exported successfully!')
    } catch (err) {
      showToast(`❌ Export failed: ${err.message}`)
    }
  }

  const [sortBy, setSortBy] = useState('score') // 'score' | 'time' | 'matches' | 'rounds'

  // Sorted Players based on user-selected criteria
  const sortedPlayers = useMemo(() => {
    const list = [...players]
    return list.sort((a, b) => {
      if (sortBy === 'time') {
        const timeA = Number(a.durationMs ?? a.duration_ms ?? Infinity)
        const timeB = Number(b.durationMs ?? b.duration_ms ?? Infinity)
        if (timeA !== timeB) return timeA - timeB
        return Number(b.score ?? 0) - Number(a.score ?? 0)
      }
      if (sortBy === 'matches') {
        const matchA = Number(a.matches ?? 0)
        const matchB = Number(b.matches ?? 0)
        if (matchA !== matchB) return matchB - matchA
        const timeA = Number(a.durationMs ?? a.duration_ms ?? Infinity)
        const timeB = Number(b.durationMs ?? b.duration_ms ?? Infinity)
        return timeA - timeB
      }
      if (sortBy === 'rounds') {
        const rA = Number(a.roundsCompleted ?? a.rounds_completed ?? 0)
        const rB = Number(b.roundsCompleted ?? b.rounds_completed ?? 0)
        if (rA !== rB) return rB - rA
        return Number(b.score ?? 0) - Number(a.score ?? 0)
      }
      // default 'score': Highest Points
      const scoreA = Number(a.score ?? 0)
      const scoreB = Number(b.score ?? 0)
      if (scoreA !== scoreB) return scoreB - scoreA
      const timeA = Number(a.durationMs ?? a.duration_ms ?? Infinity)
      const timeB = Number(b.durationMs ?? b.duration_ms ?? Infinity)
      return timeA - timeB
    })
  }, [players, sortBy])

  // Top 3 Podium & Derived Players
  const top3 = useMemo(() => sortedPlayers.slice(0, 3), [sortedPlayers])
  const roundNum = gameState.roundNumber || gameState.round_number || 1
  const isPlaying = gameState.status === 'playing'
  const isWaiting = gameState.status === 'waiting'

  return (
    <div className="audience-root" style={{ height: 'auto', minHeight: '100vh', overflowY: 'auto' }}>
      {/* Background Decor */}
      <div className="audience-backdrop" />

      {/* Main Container */}
      <div className="audience-layout" style={{ maxWidth: '1480px', margin: '0 auto', paddingBottom: '60px' }}>
        
        {/* ====================================================================
            1. TOP ADMIN CONTROL BAR
            ==================================================================== */}
        <header className="aud-header">
          {/* Brand & Portal Return */}
          <div className="aud-header-brand">
            <button
              onClick={() => navigate('/admin/dashboard')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '12px',
                backgroundColor: 'var(--aud-surface-inset)',
                border: '2.5px solid var(--aud-border)',
                boxShadow: '2px 2px 0px var(--aud-border)',
                color: 'var(--aud-text-main)',
                cursor: 'pointer',
                fontWeight: 800,
                fontSize: '0.85rem'
              }}
            >
              <ArrowLeft size={16} /> Portal
            </button>

            <div className="aud-brand-badge" style={{ background: '#f59e0b' }}>
              <Shield size={26} color="#291809" />
            </div>

            <div className="aud-brand-text">
              <h1 className="aud-brand-title">AARNA GAME CONTROLLER</h1>
              <span className="aud-brand-subtitle">HOST & ORGANIZER CONTROL ROOM</span>
            </div>
          </div>

          {/* Center Status Badge */}
          <div className="aud-header-center">
            {isPlaying ? (
              <div className="aud-status-pill live">
                <span className="aud-pulse-dot" />
                <span>ROUND #{roundNum} ACTIVE</span>
              </div>
            ) : (
              <div className="aud-status-pill waiting">
                <span>{isWaiting ? 'LOBBY READY' : 'ROUND ENDED'}</span>
              </div>
            )}
          </div>

          {/* Right Action Bar */}
          <div className="aud-header-actions" style={{ flexWrap: 'wrap' }}>
            {/* Open Audience Stage in New Window */}
            <button
              onClick={() => window.open('/display', '_blank')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: '12px',
                backgroundColor: 'var(--aud-coral-light)',
                border: '2.5px solid var(--aud-border)',
                boxShadow: '3px 3px 0px var(--aud-border)',
                color: 'var(--aud-coral-dark)',
                fontWeight: 900,
                fontSize: '0.88rem',
                cursor: 'pointer'
              }}
              title="Open the spectator screen for TV/Projector"
            >
              <ExternalLink size={16} /> Open Audience Stage
            </button>

            {/* Host Unlock / Control Actions */}
            {!isHostUnlocked ? (
              <button
                onClick={() => setShowPasswordModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 16px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--aud-gold)',
                  border: '2.5px solid var(--aud-border)',
                  boxShadow: '3px 3px 0px var(--aud-border)',
                  color: 'var(--aud-text-main)',
                  fontWeight: 900,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                <Lock size={16} /> Unlock Host Controls
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {!isPlaying ? (
                  <button
                    onClick={handleStartRound}
                    disabled={actionLoading === 'start'}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '9px 18px',
                      borderRadius: '12px',
                      backgroundColor: '#16a34a',
                      border: '2.5px solid var(--aud-border)',
                      boxShadow: '3px 3px 0px var(--aud-border)',
                      color: '#ffffff',
                      fontWeight: 900,
                      fontSize: '0.88rem',
                      cursor: 'pointer'
                    }}
                  >
                    <Play size={16} /> Start Round
                  </button>
                ) : (
                  <button
                    onClick={handleStopRound}
                    disabled={actionLoading === 'stop'}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '9px 18px',
                      borderRadius: '12px',
                      backgroundColor: '#dc2626',
                      border: '2.5px solid var(--aud-border)',
                      boxShadow: '3px 3px 0px var(--aud-border)',
                      color: '#ffffff',
                      fontWeight: 900,
                      fontSize: '0.88rem',
                      cursor: 'pointer'
                    }}
                  >
                    <Square size={16} /> Stop Round
                  </button>
                )}

                <button
                  onClick={handleResetLobby}
                  title="Reset lobby for next round"
                  style={{
                    padding: '9px 12px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--aud-surface-card)',
                    border: '2.5px solid var(--aud-border)',
                    boxShadow: '2px 2px 0px var(--aud-border)',
                    color: 'var(--aud-text-main)',
                    cursor: 'pointer'
                  }}
                >
                  <RefreshCw size={16} />
                </button>

                <button
                  onClick={handleExportCsv}
                  title="Export Leaderboard CSV"
                  style={{
                    padding: '9px 12px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--aud-surface-card)',
                    border: '2.5px solid var(--aud-border)',
                    boxShadow: '2px 2px 0px var(--aud-border)',
                    color: 'var(--aud-text-main)',
                    cursor: 'pointer'
                  }}
                >
                  <Download size={16} />
                </button>

                <button
                  onClick={handleClearScores}
                  title="Clear All Leaderboard Scores"
                  style={{
                    padding: '9px 12px',
                    borderRadius: '12px',
                    backgroundColor: '#fee2e2',
                    border: '2.5px solid var(--aud-border)',
                    boxShadow: '2px 2px 0px var(--aud-border)',
                    color: '#dc2626',
                    cursor: 'pointer'
                  }}
                >
                  <AlertTriangle size={16} />
                </button>
              </div>
            )}

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="aud-fs-btn"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
          </div>
        </header>

        {/* ====================================================================
            2. LIVE STATS CARDS ROW
            ==================================================================== */}
        <section style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          margin: '8px 0'
        }}>
          <div className="aud-stat-card" style={{ background: 'var(--aud-surface)', padding: '16px 20px', minHeight: '80px' }}>
            <div className="aud-stat-icon" style={{ fontSize: '2rem' }}>👥</div>
            <div className="aud-stat-content">
              <span className="aud-stat-value" style={{ fontSize: '2rem' }}>
                {stats.totalPlayers || players.length}
              </span>
              <span className="aud-stat-label">UNIQUE PLAYERS</span>
            </div>
          </div>

          <div className="aud-stat-card" style={{ background: 'var(--aud-surface)', padding: '16px 20px', minHeight: '80px' }}>
            <div className="aud-stat-icon" style={{ fontSize: '2rem' }}>👑</div>
            <div className="aud-stat-content">
              <span className="aud-stat-value" style={{ fontSize: '2rem', color: '#b45309' }}>
                {stats.highestScore || (players[0]?.score || 0)} pts
              </span>
              <span className="aud-stat-label">HIGHEST SCORE</span>
            </div>
          </div>

          <div className="aud-stat-card" style={{ background: 'var(--aud-surface)', padding: '16px 20px', minHeight: '80px' }}>
            <div className="aud-stat-icon" style={{ fontSize: '2rem' }}>⚡</div>
            <div className="aud-stat-content">
              <span className="aud-stat-value" style={{ fontSize: '1.6rem', color: 'var(--aud-purple-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                {players[0]?.playerName || players[0]?.player_name || '—'}
              </span>
              <span className="aud-stat-label">CURRENT LEADER</span>
            </div>
          </div>

          <div className="aud-stat-card" style={{ background: 'var(--aud-surface)', padding: '16px 20px', minHeight: '80px' }}>
            <div className="aud-stat-icon" style={{ fontSize: '2rem' }}>⏱️</div>
            <div className="aud-stat-content">
              <span className="aud-stat-value" style={{ fontSize: '2rem' }}>
                {stats.avgDurationSec || 0}s
              </span>
              <span className="aud-stat-label">AVG CLEAR TIME</span>
            </div>
          </div>
        </section>

        {/* ====================================================================
            3. TOP 3 PODIUM HERO STANDINGS
            ==================================================================== */}
        {top3.length > 0 && (
          <section style={{ margin: '8px 0' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px'
            }}>
              <h2 style={{
                fontSize: '1.1rem',
                fontWeight: 900,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: 'var(--aud-text-inv)',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                textShadow: '2px 2px 0px var(--aud-border)'
              }}>
                <Sparkles size={20} color="#facc15" /> PODIUM LEADERS
              </h2>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px'
            }}>
              {top3.map((p, idx) => {
                const rank = idx + 1
                const medalEmoji = rank === 1 ? '🥇' : (rank === 2 ? '🥈' : '🥉')

                return (
                  <motion.div
                    key={p.playerName || p.player_name || idx}
                    layout
                    layoutId={`admin-podium-${p.playerName || p.player_name}`}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className={`aud-podium-card rank-${rank}`}
                    style={{ padding: '16px 20px', minHeight: '120px' }}
                  >
                    <div className="aud-podium-top">
                      <span className="aud-podium-medal" style={{ fontSize: '1.8rem' }}>{medalEmoji}</span>
                      <span className="aud-podium-rank-tag">RANK #{rank}</span>
                    </div>

                    <div className="aud-podium-name" style={{ fontSize: '1.4rem', margin: '4px 0 8px 0' }}>
                      {p.playerName || p.player_name}
                    </div>

                    <div className="aud-podium-bottom" style={{ justifyContent: 'center' }}>
                      <span className="aud-podium-score" style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--aud-purple-dark)' }}>
                        {p.score} PTS
                      </span>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </section>
        )}

        {/* ====================================================================
            4. LIVE LEADERBOARD TABLE CARD
            ==================================================================== */}
        <section className="aud-leaderboard-card" style={{ padding: '20px 24px', flex: 'none' }}>
          <div className="aud-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h2 className="aud-card-title">
                <Medal size={22} color="#ea580c" /> FULL PARTICIPANT LEADERBOARD
              </h2>
              {lastSyncTime && (
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--aud-text-muted)' }}>
                  Last synced: {lastSyncTime.toLocaleTimeString()}
                </span>
              )}
            </div>

            {/* Sort By Filter Pills */}
            <div className="aud-sort-bar">
              <button
                onClick={() => setSortBy('score')}
                className={`aud-sort-btn ${sortBy === 'score' ? 'active' : ''}`}
                title="Rank by Highest Score"
              >
                🏆 Points
              </button>
              <button
                onClick={() => setSortBy('time')}
                className={`aud-sort-btn ${sortBy === 'time' ? 'active' : ''}`}
                title="Rank by Fastest Clear Time"
              >
                ⚡ Time
              </button>
              <button
                onClick={() => setSortBy('matches')}
                className={`aud-sort-btn ${sortBy === 'matches' ? 'active' : ''}`}
                title="Rank by Most Matches"
              >
                🎯 Matches
              </button>
              <button
                onClick={() => setSortBy('rounds')}
                className={`aud-sort-btn ${sortBy === 'rounds' ? 'active' : ''}`}
                title="Rank by Rounds Completed"
              >
                🔄 Rounds
              </button>
            </div>
          </div>

          {/* Table Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '60px 1.6fr 1fr 1fr 1fr 1.2fr',
            padding: '10px 16px',
            fontSize: '0.8rem',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--aud-text-muted)',
            borderBottom: '2px solid var(--aud-surface-inset)'
          }}>
            <div>Rank</div>
            <div>Player Name</div>
            <div>Score</div>
            <div>Rounds</div>
            <div>Matches / Errors</div>
            <div>Clear Time</div>
          </div>

          {/* Rows */}
          {sortedPlayers.length === 0 ? (
            <div className="aud-empty-state" style={{ padding: '48px 20px' }}>
              <div className="aud-empty-icon">🧩</div>
              <div className="aud-empty-title">No scores submitted yet</div>
              <p className="aud-empty-desc">Launch a round and participant rankings will appear live on this screen!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
              <AnimatePresence>
                {sortedPlayers.map((p, idx) => {
                  const rank = idx + 1
                  const isTop3 = rank <= 3
                  const medalEmoji = rank === 1 ? '🥇' : (rank === 2 ? '🥈' : (rank === 3 ? '🥉' : `#${rank}`))

                  return (
                    <motion.div
                      key={p.playerName || p.player_name || idx}
                      layout
                      layoutId={`admin-row-${p.playerName || p.player_name}`}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ type: 'spring', damping: 25, stiffness: 320 }}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '60px 1.6fr 1fr 1fr 1fr 1.2fr',
                        alignItems: 'center',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        backgroundColor: isTop3 ? '#fffdf9' : 'var(--aud-surface-card)',
                        border: '2px solid var(--aud-border)',
                        boxShadow: '2px 2px 0px var(--aud-border)',
                        fontWeight: 700
                      }}
                    >
                      {/* Rank */}
                      <div>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          fontWeight: 900,
                          fontSize: '0.9rem',
                          backgroundColor: rank === 1 ? 'var(--aud-gold)' : (rank === 2 ? '#e2e8f0' : (rank === 3 ? '#fed7aa' : 'var(--aud-surface-inset)')),
                          color: 'var(--aud-text-main)',
                          border: '1.5px solid var(--aud-border)'
                        }}>
                          {medalEmoji}
                        </span>
                      </div>

                      {/* Player Name */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontWeight: 900,
                          fontSize: '1.05rem',
                          color: 'var(--aud-text-main)'
                        }}>
                          {p.playerName || p.player_name}
                        </span>
                        {rank === 1 && <Crown size={16} color="#f59e0b" />}
                      </div>

                      {/* Score */}
                      <div>
                        <span style={{
                          fontWeight: 900,
                          fontSize: '1.1rem',
                          color: 'var(--aud-purple-dark)'
                        }}>
                          {p.score} <span style={{ fontSize: '0.75rem', color: 'var(--aud-text-muted)' }}>pts</span>
                        </span>
                      </div>

                      {/* Rounds */}
                      <div style={{ color: 'var(--aud-text-muted)', fontWeight: 800, fontSize: '0.9rem' }}>
                        {p.roundsCompleted || p.rounds_completed || 3} Rnds
                      </div>

                      {/* Matches / Mismatches */}
                      <div style={{ fontSize: '0.88rem' }}>
                        <span style={{ color: 'var(--aud-green)', fontWeight: 800 }}>+{p.matches || 0}</span>
                        <span style={{ color: 'var(--aud-text-muted)', margin: '0 4px' }}>/</span>
                        <span style={{ color: 'var(--aud-red)', fontWeight: 800 }}>-{p.mismatches || 0}</span>
                      </div>

                      {/* Clear Time */}
                      <div style={{ color: 'var(--aud-text-muted)', fontSize: '0.88rem', fontWeight: 800 }}>
                        {Math.round((p.durationMs || p.duration_ms || 0) / 1000)}s
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </section>
      </div>

      {/* ====================================================================
          5. HOST PASSWORD AUTH MODAL
          ==================================================================== */}
      <AnimatePresence>
        {showPasswordModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(41, 24, 9, 0.82)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '20px'
          }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                backgroundColor: 'var(--aud-surface)',
                border: '4px solid var(--aud-border)',
                boxShadow: '10px 10px 0px var(--aud-border)',
                borderRadius: '24px',
                padding: '32px',
                width: '100%',
                maxWidth: '420px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div className="aud-brand-badge" style={{ width: '40px', height: '40px', fontSize: '1.2rem' }}>
                  <Lock size={20} color="#291809" />
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 900, margin: 0, color: 'var(--aud-text-main)' }}>
                  Host Admin Unlock
                </h3>
              </div>

              <p style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--aud-text-muted)', margin: '0 0 20px 0' }}>
                Enter the master game admin password to unlock round controls and score resets.
              </p>

              <form onSubmit={handleHostLogin}>
                <input
                  type="password"
                  placeholder="Admin Password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--aud-surface-inset)',
                    border: '2.5px solid var(--aud-border)',
                    color: 'var(--aud-text-main)',
                    fontSize: '1rem',
                    fontWeight: 700,
                    marginBottom: '20px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '10px',
                      backgroundColor: 'transparent',
                      border: '2px solid var(--aud-border)',
                      color: 'var(--aud-text-main)',
                      cursor: 'pointer',
                      fontWeight: 800
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '10px 22px',
                      borderRadius: '10px',
                      backgroundColor: 'var(--aud-coral)',
                      border: '2.5px solid var(--aud-border)',
                      boxShadow: '3px 3px 0px var(--aud-border)',
                      color: '#fff',
                      cursor: 'pointer',
                      fontWeight: 900
                    }}
                  >
                    Unlock Controls
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ====================================================================
          6. FLOATING TOAST NOTIFICATION
          ==================================================================== */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              backgroundColor: 'var(--aud-surface)',
              border: '3px solid var(--aud-border)',
              padding: '12px 22px',
              borderRadius: '14px',
              color: 'var(--aud-text-main)',
              fontSize: '0.95rem',
              fontWeight: 900,
              boxShadow: '6px 6px 0px var(--aud-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              zIndex: 1000
            }}
          >
            <Sparkles size={18} color="#f59e0b" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default LiveLeaderboardPage

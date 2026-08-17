import React, { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Trophy, Flame, Users, Clock, Play, Square, RefreshCw, 
  Download, Maximize2, Minimize2, Radio, Zap, Shield, 
  Crown, Medal, Sparkles, CheckCircle, AlertTriangle, ArrowLeft
} from 'lucide-react'
import { liveGameApi } from '../../api/liveGameApi'
import { useNavigate } from 'react-router-dom'

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
      console.warn('[Live View] Error syncing scores:', err.message)
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

  // Top 3 Podium & Remaining Players
  const top3 = useMemo(() => players.slice(0, 3), [players])
  const remainingPlayers = useMemo(() => players.slice(3), [players])

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0d14',
      color: '#f8fafc',
      fontFamily: '"DM Sans", system-ui, -apple-system, sans-serif',
      padding: '24px 32px 64px 32px',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {/* Dynamic Background Glow Elements */}
      <div style={{
        position: 'fixed',
        top: '-10%',
        left: '20%',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(10, 13, 20, 0) 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <div style={{
        position: 'fixed',
        bottom: '-10%',
        right: '15%',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(236, 72, 153, 0.12) 0%, rgba(10, 13, 20, 0) 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <div style={{
        position: 'fixed',
        top: '40%',
        left: '-10%',
        width: '450px',
        height: '450px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, rgba(10, 13, 20, 0) 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Main Container */}
      <div style={{ maxWidth: '1440px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        
        {/* Top Header Bar */}
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          paddingBottom: '24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          {/* Brand & Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => navigate('/admin/dashboard')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '0.88rem',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)'; e.currentTarget.style.color = '#94a3b8' }}
            >
              <ArrowLeft size={16} /> Portal
            </button>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Trophy size={28} color="#eab308" />
                <h1 style={{
                  fontSize: '1.8rem',
                  fontWeight: 900,
                  letterSpacing: '-0.02em',
                  background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 50%, #94a3b8 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  margin: 0
                }}>
                  AARNA LIVE RANKINGS
                </h1>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  backgroundColor: connected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: connected ? '#34d399' : '#f87171',
                  border: `1px solid ${connected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                }}>
                  <span style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: connected ? '#10b981' : '#ef4444',
                    boxShadow: connected ? '0 0 8px #10b981' : 'none'
                  }} />
                  {connected ? 'LIVE SYNC' : 'OFFLINE'}
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                Live Audience Stage • Real-time score aggregation & smooth rank updates
              </p>
            </div>
          </div>

          {/* Action Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Round Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '12px',
              backgroundColor: gameState.status === 'playing' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${gameState.status === 'playing' ? 'rgba(99, 102, 241, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`
            }}>
              <Flame size={18} color={gameState.status === 'playing' ? '#818cf8' : '#94a3b8'} />
              <div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Round</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: gameState.status === 'playing' ? '#a5b4fc' : '#e2e8f0' }}>
                  {gameState.status === 'playing' ? `ROUND #${gameState.roundNumber || 1} ACTIVE` : (gameState.status === 'waiting' ? 'LOBBY READY' : 'ROUND ENDED')}
                </div>
              </div>
            </div>

            {/* Host Unlock Button */}
            {!isHostUnlocked ? (
              <button
                onClick={() => setShowPasswordModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(234, 179, 8, 0.15)',
                  border: '1px solid rgba(234, 179, 8, 0.35)',
                  color: '#facc15',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <Shield size={16} /> Host Controls
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {gameState.status !== 'playing' ? (
                  <button
                    onClick={handleStartRound}
                    disabled={actionLoading === 'start'}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 18px',
                      borderRadius: '12px',
                      backgroundColor: '#10b981',
                      border: 'none',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
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
                      padding: '10px 18px',
                      borderRadius: '12px',
                      backgroundColor: '#ef4444',
                      border: 'none',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)'
                    }}
                  >
                    <Square size={16} /> Stop Round
                  </button>
                )}

                <button
                  onClick={handleResetLobby}
                  title="Reset lobby for next round"
                  style={{
                    padding: '10px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#cbd5e1',
                    cursor: 'pointer'
                  }}
                >
                  <RefreshCw size={16} />
                </button>

                <button
                  onClick={handleExportCsv}
                  title="Export Leaderboard CSV"
                  style={{
                    padding: '10px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#cbd5e1',
                    cursor: 'pointer'
                  }}
                >
                  <Download size={16} />
                </button>

                <button
                  onClick={handleClearScores}
                  title="Clear All Leaderboard Scores"
                  style={{
                    padding: '10px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#f87171',
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
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Audience Mode'}
              style={{
                padding: '10px',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#cbd5e1',
                cursor: 'pointer'
              }}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
        </header>

        {/* Stats Row */}
        <section style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          margin: '24px 0 32px 0'
        }}>
          <div style={{
            padding: '18px 24px',
            borderRadius: '16px',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Users size={24} color="#818cf8" />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Unique Players</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#f8fafc' }}>{stats.totalPlayers || players.length}</div>
            </div>
          </div>

          <div style={{
            padding: '18px 24px',
            borderRadius: '16px',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'rgba(234, 179, 8, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Crown size={24} color="#facc15" />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>High Score</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#facc15' }}>
                {stats.highestScore || (players[0]?.score || 0)} <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 600 }}>pts</span>
              </div>
            </div>
          </div>

          <div style={{
            padding: '18px 24px',
            borderRadius: '16px',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Zap size={24} color="#34d399" />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Leader</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#34d399', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>
                {players[0]?.playerName || players[0]?.player_name || '—'}
              </div>
            </div>
          </div>

          <div style={{
            padding: '18px 24px',
            borderRadius: '16px',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'rgba(236, 72, 153, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Clock size={24} color="#f472b6" />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Avg Clear Time</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#f8fafc' }}>
                {stats.avgDurationSec || 0} <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 600 }}>sec</span>
              </div>
            </div>
          </div>
        </section>

        {/* Top 3 Podium / Hero Cards */}
        {top3.length > 0 && (
          <section style={{ marginBottom: '36px' }}>
            <h2 style={{
              fontSize: '1rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#94a3b8',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Sparkles size={18} color="#eab308" /> Podium Standings
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px'
            }}>
              {top3.map((p, idx) => {
                const rank = idx + 1
                const isFirst = rank === 1
                const isSecond = rank === 2
                const isThird = rank === 3

                const borderColor = isFirst ? 'rgba(234, 179, 8, 0.6)' : (isSecond ? 'rgba(148, 163, 184, 0.5)' : 'rgba(217, 119, 6, 0.5)')
                const glowBg = isFirst ? 'radial-gradient(circle at 50% 0%, rgba(234, 179, 8, 0.18), transparent 70%)' : (isSecond ? 'radial-gradient(circle at 50% 0%, rgba(148, 163, 184, 0.12), transparent 70%)' : 'radial-gradient(circle at 50% 0%, rgba(217, 119, 6, 0.12), transparent 70%)')
                const badgeColor = isFirst ? '#facc15' : (isSecond ? '#e2e8f0' : '#fb923c')

                return (
                  <motion.div
                    key={p.playerName || p.player_name}
                    layout
                    layoutId={`podium-${p.playerName || p.player_name}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    style={{
                      padding: '24px',
                      borderRadius: '20px',
                      backgroundColor: 'rgba(15, 23, 42, 0.65)',
                      backgroundImage: glowBg,
                      border: `1.5px solid ${borderColor}`,
                      backdropFilter: 'blur(16px)',
                      boxShadow: isFirst ? '0 10px 30px rgba(234, 179, 8, 0.15)' : '0 8px 24px rgba(0, 0, 0, 0.4)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '12px',
                          backgroundColor: isFirst ? 'rgba(234, 179, 8, 0.2)' : (isSecond ? 'rgba(148, 163, 184, 0.2)' : 'rgba(217, 119, 6, 0.2)'),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.3rem',
                          fontWeight: 900,
                          color: badgeColor
                        }}>
                          {isFirst ? '🥇' : (isSecond ? '🥈' : '🥉')}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: badgeColor, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            RANK #{rank}
                          </div>
                          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#f8fafc' }}>
                            {p.playerName || p.player_name}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.8rem', fontWeight: 900, color: badgeColor, lineHeight: 1 }}>
                          {p.score}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>TOTAL PTS</div>
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      fontSize: '0.82rem',
                      color: '#cbd5e1'
                    }}>
                      <span>Rounds: <strong style={{ color: '#fff' }}>{p.roundsCompleted || p.rounds_completed || 3}</strong></span>
                      <span>Matches: <strong style={{ color: '#34d399' }}>{p.matches || 0}</strong></span>
                      <span>Time: <strong style={{ color: '#93c5fd' }}>{Math.round((p.durationMs || p.duration_ms || 0) / 1000)}s</strong></span>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </section>
        )}

        {/* Live Animated Leaderboard Table */}
        <section style={{
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '24px',
          padding: '24px',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.45)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            paddingBottom: '16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 900,
              letterSpacing: '-0.01em',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <Medal size={22} color="#818cf8" /> Full Live Leaderboard
            </h2>

            {lastSyncTime && (
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Last updated: {lastSyncTime.toLocaleTimeString()}
              </span>
            )}
          </div>

          {/* Table Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '70px 1.5fr 1fr 1fr 1fr 1.2fr',
            padding: '12px 20px',
            fontSize: '0.8rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: '#64748b',
            borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
          }}>
            <div>Rank</div>
            <div>Player Name</div>
            <div>Score</div>
            <div>Rounds</div>
            <div>Matches / Errors</div>
            <div>Clear Time</div>
          </div>

          {/* Table Rows with Layout Animation */}
          {players.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '64px 20px',
              color: '#64748b'
            }}>
              <Trophy size={48} color="#334155" style={{ marginBottom: '16px' }} />
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#94a3b8' }}>No scores submitted yet</div>
              <p style={{ fontSize: '0.9rem', margin: '6px 0 0 0' }}>Launch a round and watch participant rankings appear live on this screen!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              <AnimatePresence>
                {players.map((p, idx) => {
                  const rank = idx + 1
                  const isTopRank = rank <= 3
                  const rowGlow = rank === 1 
                    ? 'rgba(234, 179, 8, 0.06)' 
                    : (rank === 2 ? 'rgba(148, 163, 184, 0.05)' : (rank === 3 ? 'rgba(217, 119, 6, 0.05)' : 'rgba(255, 255, 255, 0.02)'))

                  return (
                    <motion.div
                      key={p.playerName || p.player_name}
                      layout
                      layoutId={p.playerName || p.player_name}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ type: 'spring', damping: 25, stiffness: 320 }}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '70px 1.5fr 1fr 1fr 1fr 1.2fr',
                        alignItems: 'center',
                        padding: '14px 20px',
                        borderRadius: '14px',
                        backgroundColor: rowGlow,
                        border: isTopRank ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.04)',
                        transition: 'background-color 0.2s ease',
                        boxShadow: isTopRank ? '0 4px 12px rgba(0, 0, 0, 0.2)' : 'none'
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
                          fontSize: '0.95rem',
                          backgroundColor: rank === 1 ? '#facc15' : (rank === 2 ? '#cbd5e1' : (rank === 3 ? '#fb923c' : 'rgba(255, 255, 255, 0.08)')),
                          color: rank <= 3 ? '#0f172a' : '#94a3b8'
                        }}>
                          {rank}
                        </span>
                      </div>

                      {/* Player Name */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                          fontWeight: 800,
                          fontSize: '1.05rem',
                          color: rank === 1 ? '#facc15' : '#f8fafc'
                        }}>
                          {p.playerName || p.player_name}
                        </span>
                        {rank === 1 && <Crown size={16} color="#facc15" />}
                      </div>

                      {/* Score */}
                      <div>
                        <span style={{
                          fontWeight: 900,
                          fontSize: '1.15rem',
                          color: rank === 1 ? '#facc15' : (rank === 2 ? '#e2e8f0' : (rank === 3 ? '#fb923c' : '#38bdf8'))
                        }}>
                          {p.score} <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>pts</span>
                        </span>
                      </div>

                      {/* Rounds */}
                      <div style={{ color: '#cbd5e1', fontWeight: 700, fontSize: '0.9rem' }}>
                        {p.roundsCompleted || p.rounds_completed || 3} Rnds
                      </div>

                      {/* Matches / Mismatches */}
                      <div style={{ fontSize: '0.88rem' }}>
                        <span style={{ color: '#34d399', fontWeight: 700 }}>+{p.matches || 0}</span>
                        <span style={{ color: '#64748b', margin: '0 4px' }}>/</span>
                        <span style={{ color: '#f87171', fontWeight: 700 }}>-{p.mismatches || 0}</span>
                      </div>

                      {/* Clear Time */}
                      <div style={{ color: '#94a3b8', fontSize: '0.88rem', fontWeight: 600 }}>
                        {Math.round((p.durationMs || p.duration_ms || 0) / 1000)}s ({p.durationMs || p.duration_ms || 0}ms)
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </section>
      </div>

      {/* Host Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
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
                backgroundColor: '#0f172a',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '20px',
                padding: '32px',
                width: '100%',
                maxWidth: '400px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
              }}
            >
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 8px 0', color: '#f8fafc' }}>
                Host Admin Authentication
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#94a3b8', margin: '0 0 20px 0' }}>
                Enter the master game admin password to control live rounds.
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
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#f8fafc',
                    fontSize: '1rem',
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
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '10px 20px',
                      borderRadius: '10px',
                      backgroundColor: '#6366f1',
                      border: 'none',
                      color: '#fff',
                      cursor: 'pointer',
                      fontWeight: 700
                    }}
                  >
                    Unlock
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Toast Notification */}
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
              backgroundColor: '#1e293b',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              padding: '12px 20px',
              borderRadius: '12px',
              color: '#f8fafc',
              fontSize: '0.9rem',
              fontWeight: 700,
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              zIndex: 1000
            }}
          >
            <Sparkles size={16} color="#facc15" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

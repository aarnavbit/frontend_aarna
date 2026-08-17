import React, { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy,
  Crown,
  Users,
  Clock,
  Zap,
  Sparkles,
  QrCode,
  Flame,
  Radio,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Smartphone,
  Award,
  Gamepad2,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import QRCode from 'qrcode'
import { liveGameApi } from '../api/liveGameApi'
import './AudienceDisplayPage.css'

export function AudienceDisplayPage() {
  const [players, setPlayers] = useState([])
  const [stats, setStats] = useState({ totalPlayers: 0, highestScore: 0, avgDurationSec: 0 })
  const [gameState, setGameState] = useState({ status: 'waiting', roundNumber: 1, round_number: 1, connectedClients: 0 })
  const [connected, setConnected] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [countdown, setCountdown] = useState(null) // null | 3 | 2 | 1 | 'GO!'
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('')
  const [lastSyncTime, setLastSyncTime] = useState(null)
  const [showGrandChampionModal, setShowGrandChampionModal] = useState(false)
  const [sortBy, setSortBy] = useState('score') // 'score' | 'time' | 'matches' | 'rounds'

  const socketRef = useRef(null)
  const countdownTimerRef = useRef(null)

  // Determine Join URL
  const joinUrl = useMemo(() => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/games`
    }
    return 'https://aarna.live/games'
  }, [])

  const displayHostUrl = useMemo(() => {
    if (typeof window !== 'undefined') {
      return `${window.location.host}/games`
    }
    return 'aarna.live/games'
  }, [])

  // Generate crisp QR code on mount
  useEffect(() => {
    QRCode.toDataURL(joinUrl, {
      width: 320,
      margin: 1,
      color: {
        dark: '#291809', // Dark brown border color
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H'
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error('QR generation error:', err))
  }, [joinUrl])

  // Fullscreen event listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }

  // Fetch Latest Scores & Stats
  const fetchScores = async () => {
    try {
      const data = await liveGameApi.getScores()
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
      console.warn('[Audience Stage] Syncing scores error:', err.message)
    }
  }

  // Trigger Local Dramatic Countdown sequence
  const startCountdownSequence = () => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
    setCountdown(3)

    let current = 3
    countdownTimerRef.current = setInterval(() => {
      current -= 1
      if (current === 0) {
        setCountdown('GO!')
      } else if (current < 0) {
        clearInterval(countdownTimerRef.current)
        setCountdown(null)
      } else {
        setCountdown(current)
      }
    }, 850)
  }

  // Setup Real-time WebSockets
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
      if (state) {
        setGameState(state)
      }
    })

    socket.on('game_started', (state) => {
      if (state) setGameState(state)
      fetchScores()
      setShowGrandChampionModal(false)
      startCountdownSequence()
    })

    socket.on('game_ended', (state) => {
      if (state) setGameState(state)
      fetchScores()
      const currentRound = state?.roundNumber || state?.round_number || 1
      if (currentRound >= 3) {
        setTimeout(() => {
          setShowGrandChampionModal(true)
        }, 1200)
      }
    })

    socket.on('leaderboard_update', () => {
      fetchScores()
    })

    socket.on('leaderboard_reset', () => {
      fetchScores()
      setShowGrandChampionModal(false)
    })

    // Initial fetch
    fetchScores()

    // Backup polling every 3.5 seconds
    const interval = setInterval(fetchScores, 3500)

    return () => {
      clearInterval(interval)
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
      socket.disconnect()
    }
  }, [])

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

  // Derived Rankings from sorted list
  const top1 = useMemo(() => sortedPlayers[0] || null, [sortedPlayers])
  const top3 = useMemo(() => sortedPlayers.slice(0, 3), [sortedPlayers])
  const remainingPlayers = useMemo(() => sortedPlayers.slice(3), [sortedPlayers])

  const roundNum = gameState.roundNumber || gameState.round_number || 1
  const isPlaying = gameState.status === 'playing'
  const isWaiting = gameState.status === 'waiting'
  const isEnded = gameState.status === 'ended'

  return (
    <div className="audience-root">
      {/* Background Decor */}
      <div className="audience-backdrop" />

      {/* Main Container */}
      <div className="audience-layout">
        
        {/* ====================================================================
            1. TOP EVENT HEADER BAR
            ==================================================================== */}
        <header className="aud-header">
          {/* Brand & Trophy */}
          <div className="aud-header-brand">
            <div className="aud-brand-badge">
              <Trophy size={28} color="#291809" />
            </div>
            <div className="aud-brand-text">
              <h1 className="aud-brand-title">AARNA PUZZLE RUSH</h1>
              <span className="aud-brand-subtitle">LIVE CHAMPIONSHIP ARENA</span>
            </div>
          </div>

          {/* Center Status Indicator */}
          <div className="aud-header-center">
            {isPlaying && (
              <div className="aud-status-pill live">
                <span className="aud-pulse-dot" />
                <span>● ROUND IN PROGRESS</span>
              </div>
            )}
            {isWaiting && (
              <div className="aud-status-pill waiting">
                <span>🟡 WAITING FOR PLAYERS</span>
              </div>
            )}
            {isEnded && (
              <div className="aud-status-pill ended">
                <Sparkles size={16} />
                <span>🏆 ROUND {roundNum} COMPLETE</span>
              </div>
            )}
          </div>

          {/* Right Header Actions (Round badge, live sync, fullscreen toggle) */}
          <div className="aud-header-actions">
            <div className="aud-round-pill">
              <Flame size={18} color="#ea580c" />
              <span>ROUND {String(roundNum).padStart(2, '0')} / 03</span>
            </div>

            <div
              className="aud-round-pill"
              style={{
                background: connected ? '#dcfce7' : '#fee2e2',
                color: connected ? '#14532d' : '#991b1b'
              }}
              title={connected ? 'Real-time WebSocket active' : 'Trying to restore connection...'}
            >
              <Radio size={15} />
              <span>{connected ? 'LIVE SYNC' : 'RECONNECTING'}</span>
            </div>

            <button
              onClick={toggleFullscreen}
              className="aud-fs-btn"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter 1080p Fullscreen'}
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
          </div>
        </header>

        {/* ====================================================================
            2. DYNAMIC LIVE HERO / STATE STAGE
            ==================================================================== */}
        {isWaiting && (
          <section className="aud-hero-stage">
            <div className="aud-hero-left">
              <div className="aud-hero-icon-box waiting">
                <Gamepad2 size={34} color="#291809" />
              </div>
              <div className="aud-hero-info">
                <span className="aud-hero-tag">LOBBY OPEN • GET READY</span>
                <h2 className="aud-hero-title">NEXT ROUND STARTING SOON</h2>
                <p className="aud-hero-desc">
                  Scan the QR code on the right with your phone to enter the lobby and compete!
                </p>
              </div>
            </div>

            {/* Quick Live Stats */}
            <div className="aud-hero-stats">
              <div className="aud-stat-card">
                <div className="aud-stat-icon">👥</div>
                <div className="aud-stat-content">
                  <span className="aud-stat-value">
                    {gameState.connectedClients || stats.totalPlayers || players.length}
                  </span>
                  <span className="aud-stat-label">PLAYERS READY</span>
                </div>
              </div>
              <div className="aud-stat-card">
                <div className="aud-stat-icon">🎯</div>
                <div className="aud-stat-content">
                  <span className="aud-stat-value">{stats.highestScore || players[0]?.score || 0}</span>
                  <span className="aud-stat-label">HIGH SCORE</span>
                </div>
              </div>
              <div className="aud-stat-card">
                <div className="aud-stat-icon">⚡</div>
                <div className="aud-stat-content">
                  <span className="aud-stat-value">
                    {stats.avgDurationSec ? `${stats.avgDurationSec}s` : (players[0] ? `${Math.round((players[0].durationMs || players[0].duration_ms || 0)/1000)}s` : '—')}
                  </span>
                  <span className="aud-stat-label">FASTEST CLEAR</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {isPlaying && (
          <section className="aud-hero-stage">
            <div className="aud-hero-left">
              <div className="aud-hero-icon-box live">
                <Zap size={34} color="#ffffff" />
              </div>
              <div className="aud-hero-info">
                <span className="aud-hero-tag" style={{ color: '#166534' }}>
                  ROUND {String(roundNum).padStart(2, '0')} LIVE NOW
                </span>
                <h2 className="aud-hero-title">PLAYERS ARE SOLVING PUZZLES!</h2>
                <p className="aud-hero-desc">
                  Scores update live as participants complete pairs and finish their rounds.
                </p>
              </div>
            </div>

            <div className="aud-hero-stats">
              <div className="aud-stat-card">
                <div className="aud-stat-icon">👥</div>
                <div className="aud-stat-content">
                  <span className="aud-stat-value">{stats.totalPlayers || players.length}</span>
                  <span className="aud-stat-label">PARTICIPANTS</span>
                </div>
              </div>
              <div className="aud-stat-card">
                <div className="aud-stat-icon">✅</div>
                <div className="aud-stat-content">
                  <span className="aud-stat-value">{players.length}</span>
                  <span className="aud-stat-label">SUBMISSIONS</span>
                </div>
              </div>
              <div className="aud-stat-card">
                <div className="aud-stat-icon">👑</div>
                <div className="aud-stat-content">
                  <span className="aud-stat-value" style={{ color: '#7e22ce' }}>
                    {top1?.playerName || top1?.player_name || '—'}
                  </span>
                  <span className="aud-stat-label">CURRENT LEADER</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {isEnded && (
          <section className="aud-winner-spotlight">
            <div className="aud-winner-badge-left">
              <div className="aud-winner-crown-box">
                <Crown size={38} color="#291809" />
              </div>
              <div className="aud-winner-info">
                <span className="aud-winner-banner-tag">
                  <Sparkles size={16} /> ROUND #{roundNum} WINNER
                </span>
                <h2 className="aud-winner-name">
                  {top1?.playerName || top1?.player_name || 'Awaiting Champion'}
                </h2>
                <div className="aud-winner-stats-pills">
                  <span className="aud-winner-pill">
                    🏆 <strong>{top1?.score || 0} PTS</strong>
                  </span>
                  <span className="aud-winner-pill">
                    ⚡ <strong>{Math.round((top1?.durationMs || top1?.duration_ms || 0) / 1000)}s CLEAR TIME</strong>
                  </span>
                  <span className="aud-winner-pill">
                    🎯 <strong>{top1?.matches || 0} MATCHES</strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="aud-hero-stats">
              <div className="aud-stat-card" style={{ background: '#ffffff' }}>
                <div className="aud-stat-icon">🎉</div>
                <div className="aud-stat-content">
                  <span className="aud-stat-value">{players.length}</span>
                  <span className="aud-stat-label">TOTAL FINISHERS</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ====================================================================
            3. MAIN TWO-COLUMN ARENA GRID (Leaderboard + Join Panel)
            ==================================================================== */}
        <main className="aud-main-grid">
          
          {/* LEFT: LIVE LEADERBOARD WITH PODIUM & ANIMATED ROWS */}
          <section className="aud-leaderboard-card">
            <div className="aud-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h3 className="aud-card-title">
                  <Award size={22} color="#ea580c" /> LIVE TOURNAMENT RANKINGS
                </h3>
                <span className="aud-card-badge">
                  {sortedPlayers.length} {sortedPlayers.length === 1 ? 'Player' : 'Players'} Ranked
                </span>
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

            {/* TOP 3 PODIUM HERO CARDS - Points only in small card */}
            {top3.length > 0 && (
              <div className="aud-podium-row">
                {top3.map((p, idx) => {
                  const rank = idx + 1
                  const isGold = rank === 1
                  const isSilver = rank === 2
                  const medalEmoji = isGold ? '🥇' : isSilver ? '🥈' : '🥉'

                  return (
                    <motion.div
                      key={p.playerName || p.player_name || idx}
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                      className={`aud-podium-card rank-${rank}`}
                    >
                      <div className="aud-podium-top">
                        <span className="aud-podium-medal">{medalEmoji}</span>
                        <span className="aud-podium-rank-tag">RANK #{rank}</span>
                      </div>
                      <div className="aud-podium-name" title={p.playerName || p.player_name}>
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
            )}

            {/* SCROLLABLE LEADERBOARD TABLE LIST */}
            {sortedPlayers.length === 0 ? (
              <div className="aud-empty-state">
                <div className="aud-empty-icon">🧩</div>
                <div className="aud-empty-title">Waiting for First Clear</div>
                <p className="aud-empty-desc">
                  Join using the QR code to become the first name on the leaderboard!
                </p>
              </div>
            ) : (
              <div className="aud-leaderboard-list">
                <AnimatePresence>
                  {sortedPlayers.map((p, idx) => {
                    const rank = idx + 1
                    const isTop3 = rank <= 3
                    const medalIcon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`

                    return (
                      <motion.div
                        key={p.playerName || p.player_name || idx}
                        layout
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 380 }}
                        className="aud-row-item"
                        style={{
                          background: isTop3 ? '#fffefc' : undefined,
                          borderColor: rank === 1 ? '#f59e0b' : undefined
                        }}
                      >
                        <div className="aud-row-rank">{medalIcon}</div>
                        <div className="aud-row-name" title={p.playerName || p.player_name}>
                          {p.playerName || p.player_name}
                        </div>
                        <div className="aud-row-score">{p.score} pts</div>
                        <div className="aud-row-time">
                          ⏱️ {Math.round((p.durationMs || p.duration_ms || 0) / 1000)}s
                        </div>
                        <div className="aud-row-matches">
                          🎯 {p.matches || 0} matches
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            )}
          </section>

          {/* RIGHT: SCAN TO JOIN ARENA & QR CODE PANEL */}
          <section className="aud-join-card">
            <div>
              <div className="aud-join-badge-header">
                <Smartphone size={16} /> PHONE READY
              </div>
              <h3 className="aud-join-title">SCAN TO JOIN GAME</h3>
              <p className="aud-join-subtitle">
                Point your phone camera to jump straight into the arena!
              </p>
            </div>

            {/* CRISP QR CODE FRAME */}
            <div className="aud-qr-frame">
              {qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt="Scan QR code to join puzzle game"
                  className="aud-qr-img"
                />
              ) : (
                <div style={{ width: 190, height: 190, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <QrCode size={48} color="#291809" />
                </div>
              )}
              <span className="aud-qr-badge-corner">NO APP REQUIRED</span>
            </div>

            {/* Human-readable URL Fallback */}
            <div className="aud-join-url-box">
              <div className="aud-join-url-label">Direct Browser Link</div>
              <div className="aud-join-url-text">{displayHostUrl}</div>
            </div>

            {/* 3 Step Guide */}
            <div className="aud-join-steps">
              <div className="aud-join-step-item">
                <span className="aud-step-num">1</span>
                <span>Scan QR</span>
              </div>
              <div className="aud-join-step-item">
                <span className="aud-step-num">2</span>
                <span>Enter Name</span>
              </div>
              <div className="aud-join-step-item">
                <span className="aud-step-num">3</span>
                <span>Match & Win</span>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* ====================================================================
          4. COUNTDOWN MODAL OVERLAY (3-2-1-GO!)
          ==================================================================== */}
      <AnimatePresence>
        {countdown !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="aud-countdown-overlay"
          >
            <motion.div
              key={String(countdown)}
              initial={{ scale: 0.5, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 1.2, opacity: 0 }}
              transition={{ type: 'spring', damping: 15, stiffness: 400 }}
              className="aud-countdown-card"
            >
              <div className="aud-countdown-round">ROUND #{roundNum} STARTING</div>
              <div
                className="aud-countdown-digit"
                style={{
                  color: countdown === 'GO!' ? '#16a34a' : '#291809'
                }}
              >
                {countdown}
              </div>
              <div className="aud-countdown-prompt">
                {countdown === 'GO!' ? 'Solve all pairs as fast as you can!' : 'Hands on your screens...'}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====================================================================
          5. GRAND TOURNAMENT CHAMPION PRESENTATION (FINAL 3RD ROUND)
          ==================================================================== */}
      <AnimatePresence>
        {showGrandChampionModal && top1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="aud-grand-champ-modal"
          >
            <motion.div
              initial={{ scale: 0.7, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="aud-grand-champ-card"
            >
              <div className="aud-grand-trophy">🏆</div>
              <h2 className="aud-grand-title">TOURNAMENT CHAMPION</h2>
              <span className="aud-grand-subtitle">
                3 ROUNDS COMPLETED • HIGHEST CUMULATIVE SCORE
              </span>

              <div className="aud-grand-winner-name">
                {top1.playerName || top1.player_name}
              </div>

              <div className="aud-grand-stats-row">
                <div className="aud-stat-card" style={{ background: '#ffffff', minWidth: 160 }}>
                  <div className="aud-stat-icon">👑</div>
                  <div className="aud-stat-content">
                    <span className="aud-stat-value">{top1.score}</span>
                    <span className="aud-stat-label">TOTAL SCORE</span>
                  </div>
                </div>
                <div className="aud-stat-card" style={{ background: '#ffffff', minWidth: 160 }}>
                  <div className="aud-stat-icon">⚡</div>
                  <div className="aud-stat-content">
                    <span className="aud-stat-value">
                      {Math.round((top1.durationMs || top1.duration_ms || 0) / 1000)}s
                    </span>
                    <span className="aud-stat-label">TOTAL TIME</span>
                  </div>
                </div>
                <div className="aud-stat-card" style={{ background: '#ffffff', minWidth: 160 }}>
                  <div className="aud-stat-icon">🎯</div>
                  <div className="aud-stat-content">
                    <span className="aud-stat-value">{top1.matches || 0}</span>
                    <span className="aud-stat-label">TOTAL MATCHES</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowGrandChampionModal(false)}
                style={{
                  marginTop: 24,
                  background: 'var(--aud-surface-dark)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  padding: '8px 24px',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                View Leaderboard Stage
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AudienceDisplayPage

/**
 * Main Application Orchestrator
 * Connects UI, Game Engine, State, Audio, API, Offline Queue, and WebSockets.
 */
document.addEventListener('DOMContentLoaded', () => {
  const engine = new GameEngine(GameConfig);

  // Preload card images into memory immediately for zero-lag instant display
  if (Array.isArray(GameConfig.imagePool)) {
    GameConfig.imagePool.forEach(item => {
      const src = (typeof item === 'object' && item && item.img) ? item.img : (typeof item === 'string' && (item.startsWith('http') || item.startsWith('images/') || item.endsWith('.webp') || item.endsWith('.png') || item.endsWith('.jpg') || item.endsWith('.jpeg')) ? item : null);
      if (src) {
        const preloadImg = new Image();
        preloadImg.src = src;
      }
    });
  }

  // Global Synchronized State
  let currentGameState = { status: 'waiting', roundNumber: 0, startTime: null };
  let isPlayerWaitingInLobby = false;

  const startForm = document.getElementById('start-form');
  const nameInput = document.getElementById('player-name-input');

  // Initialize Socket.io
  const socket = (typeof io !== 'undefined') ? ((GameConfig.api.baseUrl && GameConfig.api.baseUrl.startsWith('http')) ? io(GameConfig.api.baseUrl) : io()) : null;

  if (socket) {
    socket.on('connect', () => {
      console.log('[Socket] Connected to live event server.');
    });

    socket.on('game_state', (state) => {
      if (!state) return;
      currentGameState = state;
      UI.updateLobbyStatus(state);
    });

    socket.on('game_started', (state) => {
      if (!state) return;
      console.log('[Socket] Live Game Started:', state);
      currentGameState = state;
      UI.updateLobbyStatus(state);
      UI.hideGameEndedAlert();
      const roundNum = state.roundNumber || state.round_number || 1;
      UI.showToast(`🚀 ROUND #${roundNum} HAS STARTED!`, 'success', 3500);

      // Auto-launch for players waiting in lobby with their name
      const rawName = nameInput ? nameInput.value.trim() : '';
      if (AppState.currentScreen === 'start' && (isPlayerWaitingInLobby || rawName)) {
        handleStartGame();
      }
    });

    socket.on('game_ended', (state) => {
      if (!state) return;
      console.log('[Socket] Live Game Ended:', state);
      currentGameState = state;
      UI.updateLobbyStatus(state);

      if (AppState.currentScreen === 'game') {
        UI.showGameEndedAlert();
        UI.showToast('⏳ Host ended the round! Scores will not be ranked.', 'warning', 4000);
      }
    });

    socket.on('leaderboard_update', () => {
      if (AppState.currentScreen === 'leaderboard') {
        loadLeaderboard();
      }
    });

    socket.on('leaderboard_reset', () => {
      if (AppState.currentScreen === 'leaderboard') {
        loadLeaderboard();
      }
    });
  }

  // Periodic Status Polling Backup
  function refreshStatus() {
    Api.request('/api/game/status').then(res => {
      const state = res.gameState || res;
      if (state && state.status) {
        const prevStatus = currentGameState.status;
        currentGameState = state;
        UI.updateLobbyStatus(state);

        // Auto-launch if transitioned to playing
        if (prevStatus === 'waiting' && state.status === 'playing' && AppState.currentScreen === 'start') {
          const rawName = nameInput ? nameInput.value.trim() : '';
          if (isPlayerWaitingInLobby || rawName) {
            handleStartGame();
          }
        }
      }
    }).catch(() => {});
  }

  refreshStatus();
  setInterval(() => {
    if (AppState.currentScreen === 'start') {
      refreshStatus();
    }
  }, 3000);

  // Bind State to UI Renderer
  AppState.subscribe((state, event, data) => {
    if (event === 'screen_change') {
      UI.showScreen(data.screen);
    } else if (event === 'round_start') {
      UI.updateHUD(state);
      UI.startTimer(state.roundStartTime);
    } else if (event === 'card_flipped') {
      UI.flipCard(data.cardId);
      Sound.playFlip();
    } else if (event === 'match_success') {
      UI.setMatchedCards(data.cardId1, data.cardId2);
      UI.updateHUD(state);
      Sound.playMatch();
    } else if (event === 'match_fail') {
      UI.updateHUD(state);
      Sound.playMismatch();
      UI.setMismatchCards(data.cardId1, data.cardId2, () => {
        AppState.unflipCards(data.cardId1, data.cardId2);
      });
    } else if (event === 'round_complete') {
      UI.showToast(`🎉 Round ${data.round} Clear! +${data.roundBonus + data.speedBonus} pts`, 'success', 2000);
    }
  });

  // ------------------------------------------------------------------------
  // 1. Start Game Flow
  // ------------------------------------------------------------------------
  async function handleStartGame() {
    const rawName = nameInput ? nameInput.value.trim() : '';
    if (!rawName) {
      UI.showToast('Please enter your name to play!', 'warning');
      if (nameInput) nameInput.focus();
      return;
    }

    // Check synchronized state
    if (currentGameState.status === 'waiting') {
      isPlayerWaitingInLobby = true;
      UI.setPlayerReady(true);
      UI.showToast('✅ Name registered! Waiting for host to start the round...', 'info', 3000);
      return;
    }

    if (currentGameState.status === 'ended') {
      UI.showToast('⚠️ This round has ended. Please wait for the host to start a new round!', 'warning', 3000);
      return;
    }

    // Status is 'playing' -> Start session
    isPlayerWaitingInLobby = false;
    UI.setPlayerReady(false);
    UI.hideGameEndedAlert();

    let sessionId = 'local_' + Math.random().toString(36).substring(2, 9);
    try {
      const serverSession = await Api.startGame(rawName);
      const sId = serverSession.sessionId || serverSession.session_id;
      if (sId) {
        sessionId = sId;
        if (serverSession.config) {
          GameConfig.hydrate(serverSession.config);
        }
      } else if (serverSession && serverSession.inLobby) {
        isPlayerWaitingInLobby = true;
        UI.setPlayerReady(true);
        UI.showToast(serverSession.message || 'Waiting for host...', 'info', 3000);
        return;
      }
    } catch (err) {
      console.warn('[Network] Session started:', err.message);
    }

    // Initialize App State
    AppState.initSession(sessionId, rawName, GameConfig.totalRounds);
    AppState.setScreen('game');

    // Start Round 1
    startRound(1);
  }

  if (startForm) {
    startForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleStartGame();
    });
  }

  // ------------------------------------------------------------------------
  // 2. Round Gameplay Management
  // ------------------------------------------------------------------------
  function startRound(roundNum) {
    const deck = engine.generateRoundDeck(
      roundNum,
      GameConfig.imagePool,
      GameConfig.pairsPerRound
    );

    AppState.startRound(roundNum, deck);
    UI.renderDeck(deck, handleCardClick);
  }

  function handleCardClick(cardId) {
    const result = engine.handleCardTap(cardId, AppState);
    if (!result) return;

    if (result.type === 'match') {
      if (result.isRoundComplete) {
        const roundDurationMs = Date.now() - AppState.roundStartTime;
        const bonus = engine.calculateRoundBonus(roundDurationMs);
        AppState.recordRoundCompletion(bonus.roundBonus, bonus.speedBonus, roundDurationMs);

        // Send non-blocking intermediate score update after each round (resilient for slow networks)
        submitIntermediateRoundScore(AppState.round);

        // Check if next round or final game over
        setTimeout(() => {
          if (AppState.round < GameConfig.totalRounds) {
            startRound(AppState.round + 1);
          } else {
            handleGameEnd();
          }
        }, 600);
      }
    }
  }

  // ------------------------------------------------------------------------
  // 3. Multi-Round Non-blocking Intermediate Score Submissions
  // ------------------------------------------------------------------------
  function submitIntermediateRoundScore(completedRound) {
    const sendTime = new Date();
    const intermediatePayload = {
      sessionId: AppState.sessionId,
      playerName: AppState.playerName,
      actions: {
        roundsCompleted: completedRound,
        matches: AppState.totalMatches,
        mismatches: AppState.totalMismatches,
        durationMs: Math.max(600 * completedRound, Date.now() - AppState.gameStartTime),
        roundBreakdown: AppState.roundBreakdown,
        intermediate: true,
        timestampSent: sendTime.toISOString()
      }
    };

    // Non-blocking fire-and-forget; never penalize or block user if net is slow
    Api.submitScore(intermediatePayload).catch((err) => {
      console.warn(`[Live Sync] Round ${completedRound} intermediate sync skipped (slow connection):`, err.message);
    });
  }

  // ------------------------------------------------------------------------
  // 4. Final Game Completion & Master Overriding Score Submission
  // ------------------------------------------------------------------------
  async function handleGameEnd() {
    AppState.recordGameCompletion();
    Sound.playVictory();

    const sendTime = new Date();
    const timeFormatted = sendTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const submissionPayload = {
      sessionId: AppState.sessionId,
      playerName: AppState.playerName,
      actions: {
        roundsCompleted: AppState.totalRounds,
        matches: AppState.totalMatches,
        mismatches: AppState.totalMismatches,
        durationMs: AppState.gameEndTime - AppState.gameStartTime,
        roundBreakdown: AppState.roundBreakdown,
        isFinalOverride: true,
        timestampSent: sendTime.toISOString(),
        timeString: timeFormatted
      }
    };

    let serverResult = null;
    try {
      serverResult = await Api.submitScore(submissionPayload);
      if (serverResult && serverResult.roundEnded) {
        UI.syncStatusMsg.innerHTML = `<span class="sync-dot" style="background:#ef4444;"></span> Round ended by host (Sent: ${timeFormatted}). Score not ranked.`;
        UI.showToast(`Round ended before submission. Sent at ${timeFormatted}.`, 'warning', 4000);
      } else {
        UI.syncStatusMsg.innerHTML = `<span class="sync-dot"></span> Final score synced to live rankings! (Sent: ${timeFormatted})`;
      }
    } catch (err) {
      console.warn('[Score Submit] Failed final online submission, queueing locally:', err.message);
      ScoreQueue.enqueue(submissionPayload);
      UI.syncStatusMsg.innerHTML = `<span class="sync-dot" style="background:#f59e0b;"></span> Saved offline (Sent: ${timeFormatted}). Syncing when connected!`;
    }

    UI.renderResult(AppState, serverResult);
    AppState.setScreen('result');
  }

  // ------------------------------------------------------------------------
  // 4. Leaderboard Flow
  // ------------------------------------------------------------------------
  async function loadLeaderboard() {
    AppState.setScreen('leaderboard');
    UI.leaderboardList.innerHTML = '<div class="loading-spinner">Fetching live rankings...</div>';

    try {
      const entries = await Api.getLeaderboard(50);
      UI.renderLeaderboard(entries || []);
    } catch (err) {
      console.warn('[Leaderboard] Network error fetching rankings:', err.message);
      UI.renderLeaderboard([]);
    }
  }

  // ------------------------------------------------------------------------
  // 5. Global Button Navigation Listeners
  // ------------------------------------------------------------------------
  document.getElementById('btn-view-leaderboard')?.addEventListener('click', loadLeaderboard);
  document.getElementById('btn-result-leaderboard')?.addEventListener('click', loadLeaderboard);
  document.getElementById('btn-back-to-menu')?.addEventListener('click', () => {
    AppState.setScreen('start');
    refreshStatus();
  });
  document.getElementById('btn-play-again')?.addEventListener('click', () => {
    AppState.setScreen('start');
    refreshStatus();
  });

  // Sound Toggle Button
  document.getElementById('btn-sound-toggle')?.addEventListener('click', () => {
    const isMuted = Sound.toggleMute();
    UI.updateSoundIcon(isMuted);
  });
});

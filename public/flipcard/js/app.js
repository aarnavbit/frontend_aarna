/**
 * Main Application Orchestrator
 * Connects UI, Game Engine, State, Audio, API, Offline Queue, and WebSockets.
 * Implements Host-Controlled 3-Stage Multi-Game Event System with Live Intermissions.
 */
document.addEventListener('DOMContentLoaded', () => {
  const engine = new GameEngine(GameConfig);

  // Preload logo and card images into memory immediately for zero-lag instant display
  const logoPreload = new Image();
  logoPreload.src = 'images/Logo.png';

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
  let screenBeforeLeaderboard = 'start';

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
      
      const broadcastRound = Number(state.roundNumber || state.round_number || 1);
      const stageName = broadcastRound === 1 ? 'CARD MATCH' : (broadcastRound === 2 ? 'JIGSAW PUZZLE' : '15-PUZZLE SLIDER');
      
      Sound.playFlip();
      UI.showToast(`🚀 STAGE ${broadcastRound}: ${stageName} HAS STARTED!`, 'success', 3500);

      // Auto-launch if player is on Intermission Screen
      if (AppState.currentScreen === 'intermission') {
        UI.showRoundAnnouncement('HOST ALERT', 'NEW ROUND STARTING', 'Joining automatically...');
        setTimeout(() => {
          handleStartGame(broadcastRound);
        }, 1300);
        return;
      }

      // Force launch if player is on Result Screen
      if (AppState.currentScreen === 'result') {
        UI.showRoundAnnouncement('HOST ALERT', 'NEW ROUND STARTING', 'Joining automatically...');
        setTimeout(() => {
          handleStartGame(broadcastRound);
        }, 1300);
        return;
      }

      // Auto-launch for players waiting in lobby with their name
      const rawName = nameInput ? nameInput.value.trim() : '';
      if (AppState.currentScreen === 'start' && (isPlayerWaitingInLobby || rawName)) {
        UI.showRoundAnnouncement('HOST ALERT', 'GAME STARTING', 'Pulling you in...');
        setTimeout(() => {
          handleStartGame(broadcastRound);
        }, 1300);
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
        if (prevStatus === 'waiting' && state.status === 'playing') {
          const broadcastRound = Number(state.roundNumber || state.round_number || 1);
          if (AppState.currentScreen === 'intermission') {
            UI.showRoundAnnouncement('HOST ALERT', 'NEW ROUND STARTING', 'Joining automatically...');
            setTimeout(() => handleStartGame(broadcastRound), 1300);
          } else if (AppState.currentScreen === 'start') {
            const rawName = nameInput ? nameInput.value.trim() : '';
            if (isPlayerWaitingInLobby || rawName) {
              UI.showRoundAnnouncement('HOST ALERT', 'GAME STARTING', 'Pulling you in...');
              setTimeout(() => handleStartGame(broadcastRound), 1300);
            }
          }
        }
      }
    }).catch(() => {});
  }

  refreshStatus();
  setInterval(() => {
    if (AppState.currentScreen === 'start' || AppState.currentScreen === 'intermission') {
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
      UI.showToast(`🎉 Sub-Round ${data.round} Clear! +${data.roundBonus + data.speedBonus} pts`, 'success', 2000);
    }
  });

  // ------------------------------------------------------------------------
  // 1. Start Game Flow
  // ------------------------------------------------------------------------
  async function handleStartGame(targetBroadcastRound = null) {
    const rawName = nameInput ? nameInput.value.trim() : (AppState.playerName || '');
    if (!rawName) {
      UI.showToast('Please enter your name to play!', 'warning');
      if (nameInput) nameInput.focus();
      return;
    }

    // Check synchronized state
    if (currentGameState.status === 'waiting') {
      isPlayerWaitingInLobby = true;
      AppState.playerName = rawName;
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

    let sessionId = AppState.sessionId || ('local_' + Math.random().toString(36).substring(2, 9));
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
        AppState.playerName = rawName;
        UI.setPlayerReady(true);
        UI.showToast(serverSession.message || 'Waiting for host...', 'info', 3000);
        return;
      }
    } catch (err) {
      console.warn('[Network] Session started:', err.message);
    }

    // Determine target stage based on event round
    const eventRound = targetBroadcastRound || Number(currentGameState.roundNumber || currentGameState.round_number || 1);
    let initialStage = 1;
    if (eventRound >= 1 && eventRound <= 3) initialStage = 1;
    else if (eventRound === 4) initialStage = 2;
    else if (eventRound === 5) initialStage = 3;

    AppState.initSession(sessionId, rawName, GameConfig.totalRounds || 5);
    launchBroadcastStage(initialStage);
  }

  if (startForm) {
    startForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleStartGame();
    });
  }

  // ------------------------------------------------------------------------
  // 2. Stage Launcher & Sub-Round Flow
  // ------------------------------------------------------------------------
  function launchBroadcastStage(stageNum) {
    const stage = Math.max(1, Math.min(Number(stageNum) || 1, 3));
    AppState.stage = stage;
    AppState.stageStartTime = Date.now();
    AppState.setScreen('game');

    if (stage === 1) {
      startRound(1); // Sub-round 1 of Card Match (Round 1)
    } else if (stage === 2) {
      startRound(4); // Sub-round 1 of Jigsaw Puzzle (Round 4)
    } else if (stage === 3) {
      startRound(5); // Sub-round 1 of 15-Puzzle Slider (Round 5)
    }
  }

  function startRound(roundNum) {
    const targetRound = Math.max(1, Math.min(Number(roundNum) || 1, GameConfig.totalRounds || 9));

    // ========================================================================
    // STAGE 3: 15-Puzzle Slider (Sub-Round 1 = Round 5)
    // ========================================================================
    if (targetRound === 5) {
      if (UI.cardGrid) UI.cardGrid.classList.add('hidden');
      const jigsawBoard = document.getElementById('jigsaw-board');
      if (jigsawBoard) jigsawBoard.classList.add('hidden');
      const sliderBoard = document.getElementById('slider-board');
      if (sliderBoard) sliderBoard.classList.remove('hidden');

      UI.showRoundAnnouncement('STAGE 3 • 15-PUZZLE SLIDER', '3x3 Slider Challenge', 'Slide the tiles to restore the image!');

      const sliderImgSrc = Array.isArray(GameConfig.sliderImages) && GameConfig.sliderImages.length > 0
        ? GameConfig.sliderImages[0]
        : 'images/Logo.png';

      AppState.startRound(targetRound, []);

      if (!window.sliderGame) {
        window.sliderGame = new SliderEngine('slider-board', sliderImgSrc);
      }
      
      window.sliderGame.startPuzzle(targetRound, (moves) => {
        const roundDurationMs = Date.now() - AppState.roundStartTime;
        const bonus = engine.calculateRoundBonus(roundDurationMs);
        AppState.matchesThisRound = 9;
        AppState.totalMatches += AppState.matchesThisRound;
        AppState.recordRoundCompletion(bonus.roundBonus, bonus.speedBonus, roundDurationMs);

        submitIntermediateRoundScore(targetRound);

        // Stage 3 Complete -> Grand Champion Victory Screen!
        setTimeout(() => {
          handleGameEnd();
        }, 1200);
      }, sliderImgSrc);
      return;
    }

    // ========================================================================
    // STAGE 2: Jigsaw Puzzle (Sub-Round 1 = Round 4)
    // ========================================================================
    if (targetRound === 4) {
      if (UI.cardGrid) UI.cardGrid.classList.add('hidden');
      const sliderBoard = document.getElementById('slider-board');
      if (sliderBoard) sliderBoard.classList.add('hidden');
      const jigsawBoard = document.getElementById('jigsaw-board');
      if (jigsawBoard) jigsawBoard.classList.remove('hidden');

      UI.showRoundAnnouncement('STAGE 2 • JIGSAW PUZZLE', '12-Piece Image Puzzle', 'Drag & fit the pieces into place!');

      const jigsawImgSrc = Array.isArray(GameConfig.jigsawImages) && GameConfig.jigsawImages.length > 0
        ? GameConfig.jigsawImages[0]
        : 'images/puzzel.jpeg';

      AppState.startRound(targetRound, []);

      if (!window.jigsawGame) {
        window.jigsawGame = new JigsawEngine('jigsaw-canvas');
      }
      
      window.jigsawGame.startPuzzle(targetRound, () => {
        const roundDurationMs = Date.now() - AppState.roundStartTime;
        const bonus = engine.calculateRoundBonus(roundDurationMs);
        AppState.matchesThisRound = 12;
        AppState.totalMatches += AppState.matchesThisRound;
        AppState.recordRoundCompletion(bonus.roundBonus, bonus.speedBonus, roundDurationMs);

        submitIntermediateRoundScore(targetRound);

        // Stage 2 Complete -> Transition to Stage 2 Intermission Screen!
        setTimeout(() => {
          enterIntermission(2);
        }, 1000);
      }, jigsawImgSrc);
      return;
    }

    // ========================================================================
    // STAGE 1: Card Flip Matching (Sub-Rounds 1, 2, 3 = Rounds 1, 2, 3)
    // ========================================================================
    const jigsawBoard = document.getElementById('jigsaw-board');
    if (jigsawBoard) jigsawBoard.classList.add('hidden');
    const sliderBoard = document.getElementById('slider-board');
    if (sliderBoard) sliderBoard.classList.add('hidden');
    if (UI.cardGrid) UI.cardGrid.classList.remove('hidden');

    if (targetRound === 1) {
      UI.showRoundAnnouncement('STAGE 1 • MEMORY MATCH', 'Card Flip Challenge', 'Find matching pairs in fewest moves!');
    }

    const deck = engine.generateRoundDeck(
      targetRound,
      GameConfig.imagePool,
      GameConfig.pairsPerRound || 3
    );

    AppState.startRound(targetRound, deck);
    UI.renderDeck(deck, handleCardClick);
  }

  function handleCardClick(cardId) {
    const result = engine.handleCardTap(cardId, AppState);
    if (!result) return;

    if (result.type === 'match') {
      if (result.isRoundComplete) {
        const currentSubRound = AppState.round; // 1, 2, 3
        const roundDurationMs = Date.now() - AppState.roundStartTime;
        const bonus = engine.calculateRoundBonus(roundDurationMs);
        AppState.recordRoundCompletion(bonus.roundBonus, bonus.speedBonus, roundDurationMs);

        // Send non-blocking intermediate score update after each completed sub-round
        submitIntermediateRoundScore(currentSubRound);

        if (currentSubRound < 3) {
          setTimeout(() => {
            startRound(currentSubRound + 1);
          }, 900);
        } else {
          // Stage 1 Complete -> Transition to Stage 1 Intermission Screen!
          setTimeout(() => {
            enterIntermission(1);
          }, 1000);
        }
      }
    }
  }

  // ------------------------------------------------------------------------
  // 3. Stage Intermission Management
  // ------------------------------------------------------------------------
  async function enterIntermission(completedStage) {
    AppState.stage = completedStage;
    AppState.setScreen('intermission');

    // Fetch latest live rank for the player
    let currentRank = null;
    try {
      if (AppState.sessionId) {
        const sessionData = await Api.request(`/api/game/session/${AppState.sessionId}`);
        if (sessionData && sessionData.rank) {
          currentRank = sessionData.rank;
          AppState.serverRank = currentRank;
        }
      }
    } catch (e) {
      console.warn('[Intermission] Rank sync info:', e.message);
    }

    const nextRoundNum = completedStage + 1;
    const nextStageName = nextRoundNum === 2 ? 'Jigsaw Puzzle' : (nextRoundNum === 3 ? '15-Puzzle Slider' : 'Next Stage');

    UI.renderIntermission(completedStage, AppState, nextStageName, currentRank);
    Sound.playVictory();
    UI.showToast(`🎉 Stage ${completedStage} Cleared! Waiting for Host to broadcast Stage ${nextRoundNum}...`, 'success', 4500);
  }

  // ------------------------------------------------------------------------
  // 4. Multi-Round Non-blocking Intermediate Score Submissions
  // ------------------------------------------------------------------------
  function submitIntermediateRoundScore(completedRound) {
    const sendTime = new Date();
    const intermediatePayload = {
      sessionId: AppState.sessionId,
      session_id: AppState.sessionId,
      playerName: AppState.playerName,
      player_name: AppState.playerName,
      score: AppState.score,
      matches: AppState.totalMatches,
      mismatches: AppState.totalMismatches,
      roundsCompleted: completedRound,
      rounds_completed: completedRound,
      durationMs: Math.max(600 * completedRound, Date.now() - AppState.gameStartTime),
      duration_ms: Math.max(600 * completedRound, Date.now() - AppState.gameStartTime),
      actions: {
        score: AppState.score,
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
      console.warn(`[Live Sync] Round ${completedRound} intermediate sync queued locally:`, err.message);
      ScoreQueue.enqueue(intermediatePayload);
    });
  }

  // ------------------------------------------------------------------------
  // 5. Final Game Completion & Grand Champion Presentation
  // ------------------------------------------------------------------------
  async function handleGameEnd(isEarlySubmit = false) {
    if (isEarlySubmit) {
      AppState.score = Math.max(0, AppState.score - 500);
      UI.showToast('⚠️ Early Submit Penalty: -500 points', 'warning', 3500);
    } else {
      // Global Time Bonus for finishing the whole game
      const totalTimeMs = Date.now() - AppState.gameStartTime;
      let globalTimeBonus = 0;
      if (totalTimeMs < 45000) globalTimeBonus = 3000;
      else if (totalTimeMs < 75000) globalTimeBonus = 1500;
      else if (totalTimeMs < 120000) globalTimeBonus = 500;
      
      if (globalTimeBonus > 0) {
        AppState.score += globalTimeBonus;
        UI.showToast(`⚡ Global Time Bonus: +${globalTimeBonus} points!`, 'success', 3500);
      }
    }

    AppState.recordGameCompletion();
    Sound.playVictory();

    const sendTime = new Date();
    const timeFormatted = sendTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const actualRoundsCompleted = AppState.roundBreakdown.length;
    const submissionPayload = {
      sessionId: AppState.sessionId,
      session_id: AppState.sessionId,
      playerName: AppState.playerName,
      player_name: AppState.playerName,
      score: AppState.score,
      matches: AppState.totalMatches,
      mismatches: AppState.totalMismatches,
      roundsCompleted: actualRoundsCompleted,
      rounds_completed: actualRoundsCompleted,
      durationMs: AppState.gameEndTime - AppState.gameStartTime,
      duration_ms: AppState.gameEndTime - AppState.gameStartTime,
      actions: {
        score: AppState.score,
        roundsCompleted: actualRoundsCompleted,
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
  // 6. Leaderboard Flow
  // ------------------------------------------------------------------------
  async function loadLeaderboard() {
    screenBeforeLeaderboard = AppState.currentScreen;
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
  // 7. Global Button Navigation Listeners
  // ------------------------------------------------------------------------
  document.getElementById('btn-view-leaderboard')?.addEventListener('click', loadLeaderboard);
  document.getElementById('btn-result-leaderboard')?.addEventListener('click', loadLeaderboard);
  document.getElementById('btn-intermission-leaderboard')?.addEventListener('click', loadLeaderboard);
  
  document.getElementById('btn-back-from-leaderboard')?.addEventListener('click', () => {
    if (screenBeforeLeaderboard === 'intermission') {
      AppState.setScreen('intermission');
    } else if (screenBeforeLeaderboard === 'result') {
      AppState.setScreen('result');
    } else {
      AppState.setScreen('start');
      refreshStatus();
    }
  });

  document.getElementById('btn-refresh-leaderboard')?.addEventListener('click', loadLeaderboard);

  document.getElementById('btn-leaderboard-play')?.addEventListener('click', () => {
    if (AppState.currentScreen === 'leaderboard' && screenBeforeLeaderboard === 'intermission') {
      AppState.setScreen('intermission');
    } else {
      AppState.setScreen('start');
      refreshStatus();
    }
  });

  document.getElementById('btn-play-again')?.addEventListener('click', () => {
    AppState.setScreen('start');
    refreshStatus();
  });

  document.getElementById('btn-submit-quit')?.addEventListener('click', () => {
    if (confirm('Are you sure you want to submit your current score and end the game? (-500 pt penalty)')) {
      handleGameEnd(true);
    }
  });

  // Sound Toggle Button
  document.getElementById('btn-toggle-sound')?.addEventListener('click', () => {
    const isMuted = Sound.toggleMute();
    UI.updateSoundIcon(isMuted);
  });
  document.getElementById('btn-sound-toggle')?.addEventListener('click', () => {
    const isMuted = Sound.toggleMute();
    UI.updateSoundIcon(isMuted);
  });
});

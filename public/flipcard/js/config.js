/**
 * Game Configuration Module
 * Single place for all tuning parameters. Zero hardcoding in engine/UI!
 */

function resolveApiBaseUrl() {
  if (typeof window === 'undefined') return 'http://localhost:3000';

  // 1. Explicit global override
  if (window.__GAME_API_URL__) {
    return window.__GAME_API_URL__.replace(/\/+$/, '');
  }

  // 2. URL search parameter override (e.g. ?api=https://backend.example.com)
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const queryApi = urlParams.get('api');
    if (queryApi) {
      sessionStorage.setItem('GAME_API_URL', queryApi);
      return queryApi.replace(/\/+$/, '');
    }
    const storedApi = sessionStorage.getItem('GAME_API_URL') || localStorage.getItem('GAME_API_URL');
    if (storedApi) {
      return storedApi.replace(/\/+$/, '');
    }
  } catch (e) {
    // Storage access fallback
  }

  // 3. Current host origin (production deployment)
  if (window.location.origin && !window.location.origin.includes('localhost') && !window.location.origin.includes('127.0.0.1')) {
    return window.location.origin;
  }

  // 4. Local development default
  return 'http://localhost:3000';
}

const GameConfig = {
  // Game parameters
  totalRounds: 3,
  pairsPerRound: 3, // 3 pairs = 6 cards per round
  mismatchDelayMs: 800,

  // Easily customizable Image/Emoji Pool (18 items)
  imagePool: [
    "⚡", "🔥", "🚀", "💎", "⭐", "🍕", 
    "🎮", "🏆", "🦄", "🎸", "🎯", "👑", 
    "🪐", "🍀", "👾", "🍔", "🌈", "🍦"
  ],

  // Scoring Rules
  scoring: {
    pointsPerMatch: 100,
    wrongMatchPenalty: 20,
    roundBonus: 150,
    maxSpeedBonusPerRound: 100,
    targetRoundDurationSeconds: 10
  },

  // Networking & Reliability
  api: {
    baseUrl: resolveApiBaseUrl(),
    timeoutMs: 8000,
    retryIntervalMs: 5000,
    maxQueueRetries: 10
  },

  // Method to merge dynamic config from backend
  hydrate(serverConfig) {
    if (!serverConfig) return;
    if (serverConfig.totalRounds) this.totalRounds = serverConfig.totalRounds;
    if (serverConfig.pairsPerRound) this.pairsPerRound = serverConfig.pairsPerRound;
    if (serverConfig.mismatchDelayMs) this.mismatchDelayMs = serverConfig.mismatchDelayMs;
    if (Array.isArray(serverConfig.imagePool) && serverConfig.imagePool.length >= this.pairsPerRound) {
      this.imagePool = serverConfig.imagePool;
    }
    if (serverConfig.scoring) {
      this.scoring = { ...this.scoring, ...serverConfig.scoring };
    }
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameConfig;
}

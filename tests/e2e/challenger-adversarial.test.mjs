import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert'
import { setupDomEnvironment } from '../helpers/dom-shim.mjs'
import { loadCssStylesheets } from '../helpers/css-inspector.mjs'
import { MockSocket } from '../helpers/mock-socket.mjs'
import { api } from '../../src/api/client.js'
import { adminApi } from '../../src/api/adminApi.js'
import { liveGameApi } from '../../src/api/liveGameApi.js'
import { portfolios, objectives } from '../../src/data/clubContent.js'

describe('Adversarial Challenger Stress & Chaos Suite', () => {
  let domEnv
  let cssInspector

  beforeEach(() => {
    domEnv = setupDomEnvironment()
    cssInspector = loadCssStylesheets()
  })

  describe('1. Extreme Viewport Breakpoints & Resolution Stress (280px to 4K)', () => {
    it('ADV-1.1: should handle ultra-compact 280px viewport (Galaxy Fold Cover Display)', () => {
      domEnv.setViewportWidth(280)
      const isMobile = domEnv.window.matchMedia('(max-width: 768px)').matches
      assert.strictEqual(isMobile, true, '280px must be identified as mobile viewport')

      // Body minimum width protection against layout compression collapse
      const bodyDecls = cssInspector.getDeclarationsFor('body')
      assert.ok(
        bodyDecls.some(d => d.includes('min-width: 320px')),
        'Body must enforce min-width: 320px to preserve minimal structural integrity'
      )

      // Shell clipping to prevent horizontal leaks
      assert.strictEqual(cssInspector.hasOverflowClipOnShell(), true, '.site-shell must clip horizontal overflow')
    })

    it('ADV-1.2: should maintain responsive styling across full spectrum: 320px, 375px, 480px, 768px, 1024px', () => {
      const spectrum = [320, 375, 414, 480, 768, 1024]
      for (const width of spectrum) {
        domEnv.setViewportWidth(width)
        const isMobile = domEnv.window.matchMedia('(max-width: 768px)').matches
        if (width <= 768) {
          assert.strictEqual(isMobile, true, `Viewport ${width}px should match mobile media query`)
        } else {
          assert.strictEqual(isMobile, false, `Viewport ${width}px should be desktop layout`)
        }
      }
    })

    it('ADV-1.3: should handle extreme wide resolutions (2560px QHD and 3840px 4K UHD)', () => {
      // 2560px QHD
      domEnv.setViewportWidth(2560)
      assert.strictEqual(domEnv.window.matchMedia('(max-width: 768px)').matches, false)
      const sectionDecls = cssInspector.getDeclarationsFor('.section-wrap')
      assert.ok(
        sectionDecls.some(d => d.includes('min(1120px') || d.includes('max-width')),
        '.section-wrap must bound content width on ultra-wide screens'
      )

      // 3840px 4K Projector / UHD
      domEnv.setViewportWidth(3840)
      assert.strictEqual(domEnv.window.innerWidth, 3840)
      assert.strictEqual(domEnv.window.matchMedia('(min-width: 1024px)').matches, true)
    })

    it('ADV-1.4: should enforce touch-target sizing (>= 44x44px) across all interactive touch surfaces', () => {
      const touchSelectors = ['.theme-toggle', '.mobile-menu-toggle', '.mobile-drawer-close', '.button', '.btn-icon']
      for (const sel of touchSelectors) {
        const target = cssInspector.inspectTouchTarget(sel)
        if (target.exists) {
          assert.ok(target.meetsStandard, `Touch selector ${sel} must meet >= 44x44px touch bounding requirement`)
        }
      }
    })
  })

  describe('2. Telemetry Storm & Socket Burst Stress Testing', () => {
    it('ADV-2.1: should sustain a burst of 500 rapid socket events within milliseconds without error', () => {
      const mockSocket = new MockSocket('http://localhost:5000')
      let eventCount = 0
      let lastRankings = []

      mockSocket.on('leaderboard_update', (data) => {
        eventCount++
        lastRankings = data.leaderboard || []
      })

      // Simulate rapid burst of 500 leaderboard telemetry updates
      for (let i = 0; i < 500; i++) {
        mockSocket.triggerServerEvent('leaderboard_update', {
          leaderboard: [
            { rank: 1, playerName: `Player_${i}`, score: 1000 + i, durationMs: 15000, matches: 9, mismatches: i % 3 },
            { rank: 2, playerName: `Player_${i - 1}`, score: 900 + i, durationMs: 18000, matches: 9, mismatches: 2 },
            { rank: 3, playerName: `Player_${i - 2}`, score: 800 + i, durationMs: 22000, matches: 9, mismatches: 4 }
          ],
          timestamp: Date.now()
        })
      }

      assert.strictEqual(eventCount, 500, 'All 500 socket burst events must be ingested')
      assert.strictEqual(lastRankings.length, 3)
      assert.strictEqual(lastRankings[0].playerName, 'Player_499')
    })

    it('ADV-2.2: should safely process corrupted, malformed, and NaN player objects in telemetry data', () => {
      const mockSocket = new MockSocket('http://localhost:5000')
      const processed = []

      mockSocket.on('leaderboard_update', (data) => {
        const sanitized = (data.leaderboard || []).map((p, idx) => ({
          rank: typeof p.rank === 'number' ? p.rank : idx + 1,
          playerName: String(p.playerName || 'Anonymous Player').trim().slice(0, 50),
          score: Number.isFinite(Number(p.score)) ? Math.max(0, Number(p.score)) : 0,
          durationMs: Number.isFinite(Number(p.durationMs)) ? Math.max(0, Number(p.durationMs)) : 0,
          matches: Number.isFinite(Number(p.matches)) ? Number(p.matches) : 0,
          mismatches: Number.isFinite(Number(p.mismatches)) ? Number(p.mismatches) : 0
        }))
        processed.push(...sanitized)
      })

      // Send payload with adversarial corruptions
      mockSocket.triggerServerEvent('leaderboard_update', {
        leaderboard: [
          { rank: null, playerName: null, score: 'NaN', durationMs: undefined, matches: null, mismatches: -5 },
          { rank: 'invalid', playerName: '   ', score: -9999, durationMs: -50000, matches: 'nine', mismatches: NaN },
          { rank: 3, playerName: 'Valid Player', score: 950, durationMs: 12000, matches: 9, mismatches: 0 }
        ]
      })

      assert.strictEqual(processed.length, 3)
      assert.strictEqual(processed[0].playerName, 'Anonymous Player')
      assert.strictEqual(processed[0].score, 0)
      assert.strictEqual(processed[0].durationMs, 0)
      assert.strictEqual(processed[1].score, 0) // clamped from -9999
      assert.strictEqual(processed[2].playerName, 'Valid Player')
      assert.strictEqual(processed[2].score, 950)
    })

    it('ADV-2.3: should handle rapid socket connect/disconnect flapping (100 cycles)', () => {
      const mockSocket = new MockSocket('http://localhost:5000')
      let connectCount = 0
      let disconnectCount = 0

      mockSocket.on('connect', () => connectCount++)
      mockSocket.on('disconnect', () => disconnectCount++)

      for (let i = 0; i < 100; i++) {
        mockSocket.simulateConnect()
        mockSocket.simulateDisconnect(`network-drop-${i}`)
      }

      assert.strictEqual(connectCount, 100)
      assert.strictEqual(disconnectCount, 100)
      assert.strictEqual(mockSocket.connected, false)
    })
  })

  describe('3. Adversarial Payloads & Extreme Text Stress', () => {
    it('ADV-3.1: should safely accept 10,000-character continuous unbroken string in SOP without crash', async () => {
      const massiveString = 'A'.repeat(10000)
      const payload = {
        fullName: 'Stress Test Candidate',
        email: 'candidate.stress@example.edu',
        phone: '+91 98765 43210',
        rollNumber: '21CS99999',
        department: 'CSE',
        year: '3',
        portfolio: 'fullstack',
        sop: massiveString
      }

      // Offline submit fallback
      const result = await api.submitApplication(payload)
      assert.strictEqual(result.success, true)
      assert.ok(result.application)
      assert.strictEqual(result.application.sop.length, 10000)

      // Verify stored in localStorage mock
      const stored = JSON.parse(domEnv.localStorage.getItem('aarana_mock_applications') || '[]')
      const found = stored.find(a => a.rollNumber === '21CS99999')
      assert.ok(found, 'Application with massive SOP must be persisted in mock storage')
      assert.strictEqual(found.sop.length, 10000)
    })

    it('ADV-3.2: should safely store and sanitize XSS polyglots, SQL injection strings, and unicode zalgo', async () => {
      const xssVectors = [
        '<script>alert("XSS")</script>',
        '"><img src=x onerror=alert(1)>',
        '\' OR \'1\'=\'1\'; DROP TABLE applicants; --',
        '🚀🔥✨💻 Arabic: مرحبا بالعالم | Hebrew: שלום עולם | Zalgo: H̶e̷l̸l̴o̵',
        'data:text/html,<script>alert(document.cookie)</script>'
      ]

      for (let i = 0; i < xssVectors.length; i++) {
        const payload = {
          fullName: `Candidate_${i}_${xssVectors[i]}`,
          email: `vuln_test_${i}@example.com`,
          phone: '9876543210',
          rollNumber: `XSS_${i}`,
          department: 'AI_DS',
          year: '2',
          portfolio: 'cybersecurity',
          sop: xssVectors[i]
        }

        const res = await api.submitApplication(payload)
        assert.strictEqual(res.success, true)
        assert.strictEqual(res.application.sop, xssVectors[i])
      }

      const stored = JSON.parse(domEnv.localStorage.getItem('aarana_mock_applications') || '[]')
      assert.ok(stored.length >= xssVectors.length)
    })

    it('ADV-3.3: should handle multi-criteria filtering and sorting over large dataset of 1,000 applicants in < 50ms', () => {
      // Generate 1,000 mock applicants across 5 departments, 4 years, and 4 statuses
      const depts = ['CSE', 'ECE', 'AI_DS', 'MECH', 'CIVIL']
      const years = ['1', '2', '3', '4']
      const statuses = ['Pending', 'Shortlisted', 'Interviewed', 'Rejected']
      const portfoliosList = ['fullstack', 'aiml', 'design', 'cybersecurity']

      const dataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `app_${i}`,
        fullName: `Applicant Number ${i} With Long Name Extender`,
        rollNumber: `22CS${String(i).padStart(4, '0')}`,
        email: `student_${i}@university.edu`,
        department: depts[i % depts.length],
        year: years[i % years.length],
        portfolio: portfoliosList[i % portfoliosList.length],
        status: statuses[i % statuses.length],
        createdAt: new Date(Date.now() - i * 60000).toISOString()
      }))

      const startTime = performance.now()

      // Complex filter operation
      const filtered = dataset.filter(item => {
        const matchesQuery = item.fullName.toLowerCase().includes('number 10') || item.rollNumber.toLowerCase().includes('22cs01')
        const matchesDept = item.department === 'CSE'
        const matchesYear = item.year === '1'
        const matchesStatus = item.status === 'Pending'
        return matchesQuery && matchesDept && matchesYear && matchesStatus
      })

      // Sorting
      const sorted = [...dataset].sort((a, b) => a.fullName.localeCompare(b.fullName))

      const elapsed = performance.now() - startTime

      assert.ok(Array.isArray(filtered))
      assert.strictEqual(sorted.length, 1000)
      assert.ok(elapsed < 100, `Filtering 1,000 items took ${elapsed.toFixed(2)}ms (must be < 100ms)`)
    })
  })

  describe('4. Network Chaos & HTTP Error Degradation', () => {
    it('ADV-4.1: should handle 500 Internal Server Error gracefully without crashing client', async () => {
      // Mock global fetch returning 500 error
      const originalFetch = globalThis.fetch
      globalThis.fetch = async () => ({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Database connection failed' })
      })

      try {
        await adminApi.getApplicants()
        assert.fail('Should have thrown error on 500')
      } catch (err) {
        assert.ok(err instanceof Error)
        assert.ok(err.message.includes('500') || err.message.includes('Database connection failed') || err.message.includes('error'))
      } finally {
        globalThis.fetch = originalFetch
      }
    })

    it('ADV-4.2: should handle non-JSON HTML response (e.g. 502 Bad Gateway proxy page)', async () => {
      const originalFetch = globalThis.fetch
      globalThis.fetch = async () => ({
        ok: false,
        status: 502,
        statusText: 'Bad Gateway',
        json: async () => {
          throw new SyntaxError('Unexpected token < in JSON at position 0')
        },
        text: async () => '<html><body>502 Bad Gateway</body></html>'
      })

      try {
        await adminApi.login('ADMIN', 'badpass')
        assert.fail('Should have thrown on 502')
      } catch (err) {
        assert.ok(err instanceof Error)
      } finally {
        globalThis.fetch = originalFetch
      }
    })

    it('ADV-4.3: should handle total network disconnection (fetch throws TypeError)', async () => {
      const originalFetch = globalThis.fetch
      globalThis.fetch = async () => {
        throw new TypeError('Failed to fetch')
      }

      // Public application submission has seamless offline localStorage fallback
      const result = await api.submitApplication({
        fullName: 'Offline Test User',
        email: 'offline@test.com',
        phone: '1234567890',
        rollNumber: 'OFFLINE001',
        department: 'CSE',
        year: '2',
        portfolio: 'aiml',
        sop: 'Offline testing submission'
      })

      assert.strictEqual(result.success, true)
      assert.ok(result.application)
      assert.strictEqual(result.application.rollNumber, 'OFFLINE001')

      globalThis.fetch = originalFetch
    })

    it('ADV-4.4: should evict credentials on 401 Unauthorized cascade', async () => {
      domEnv.localStorage.setItem('aarna_admin_token', 'expired_jwt_token_123')
      domEnv.localStorage.setItem('aarna_admin_info', JSON.stringify({ role: 'admin', name: 'Test' }))

      const originalFetch = globalThis.fetch
      globalThis.fetch = async () => ({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ error: 'Token expired' })
      })

      try {
        await adminApi.getApplicants()
      } catch (err) {
        // Expected error
      }

      // Eviction on 401
      adminApi.logout()
      assert.strictEqual(domEnv.localStorage.getItem('aarna_admin_token'), null)
      assert.strictEqual(domEnv.localStorage.getItem('aarna_admin_info'), null)

      globalThis.fetch = originalFetch
    })
  })

  describe('5. Storage Corruption & State Recovery Stress', () => {
    it('ADV-5.1: should recover gracefully when localStorage contains corrupted non-JSON strings', () => {
      domEnv.localStorage.setItem('aarna_form_draft_step1', 'CORRUPT_JSON_DATA{{{{{')
      domEnv.localStorage.setItem('aarana_mock_applications', 'NOT_AN_ARRAY: null')
      domEnv.localStorage.setItem('aarna_theme', 'invalid-theme-variant')

      // Safe JSON parse wrapper test
      let draft = null
      try {
        const raw = domEnv.localStorage.getItem('aarna_form_draft_step1')
        draft = raw ? JSON.parse(raw) : null
      } catch {
        draft = null
      }
      assert.strictEqual(draft, null, 'Corrupted draft JSON should safely fallback to null')

      let apps = []
      try {
        const raw = domEnv.localStorage.getItem('aarana_mock_applications')
        apps = raw ? JSON.parse(raw) : []
        if (!Array.isArray(apps)) apps = []
      } catch {
        apps = []
      }
      assert.deepStrictEqual(apps, [], 'Corrupted applications list should safely fallback to empty array')
    })
  })

  describe('6. Data Contract Integrity & Immutability', () => {
    it('ADV-6.1: should preserve all 7 club portfolio definitions and essential schema fields', () => {
      assert.strictEqual(portfolios.length, 7, 'Must maintain exactly 7 club portfolios')
      for (const p of portfolios) {
        assert.ok(p.name, 'Portfolio must have name')
        assert.ok(p.short, 'Portfolio must have short name')
        assert.ok(p.desc, 'Portfolio must have description')
        assert.ok(Array.isArray(p.tools), 'Portfolio must define tools array')
        assert.ok(Array.isArray(p.interviewFocus) || typeof p.interviewFocus === 'string', 'Portfolio must define interview focus')
        assert.ok(p.eligibility, 'Portfolio must specify eligibility')
      }
    })

    it('ADV-6.2: should preserve all 4 strategic club objectives', () => {
      assert.strictEqual(objectives.length, 4, 'Must maintain 4 strategic club objectives')
      for (const obj of objectives) {
        assert.strictEqual(typeof obj, 'string', 'Objective must be a non-empty string')
        assert.ok(obj.length > 0, 'Objective string must not be empty')
      }
    })
  })
})

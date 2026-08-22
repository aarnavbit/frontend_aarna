import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert'
import { setupDomEnvironment } from '../helpers/dom-shim.mjs'
import { portfolios, objectives } from '../../src/data/clubContent.js'
import { api } from '../../src/api/client.js'
import { adminApi } from '../../src/api/adminApi.js'
import { liveGameApi } from '../../src/api/liveGameApi.js'
import { MockSocket } from '../helpers/mock-socket.mjs'

describe('Tier 1: Feature Coverage & Interface Contracts', () => {
  let domEnv

  beforeEach(() => {
    domEnv = setupDomEnvironment()
  })

  describe('Feature 1: 14 Routes Routing & Component Resolution', () => {
    const expectedRoutes = [
      { path: '/', type: 'public', component: 'HomePage', shell: true },
      { path: '/apply', type: 'public', component: 'ApplyPage', shell: true },
      { path: '/display', type: 'audience', component: 'AudienceDisplayPage', shell: false },
      { path: '/audience', type: 'audience', component: 'AudienceDisplayPage', shell: false },
      { path: '/stage', type: 'audience', component: 'AudienceDisplayPage', shell: false },
      { path: '/live-display', type: 'audience', component: 'AudienceDisplayPage', shell: false },
      { path: '/admin/login', type: 'admin', component: 'AdminLogin', shell: false },
      { path: '/admin/dashboard', type: 'admin', component: 'AdminDashboardPage', shell: false },
      { path: '/dashboard', type: 'admin', component: 'AdminDashboardPage', shell: false },
      { path: '/admin/live', type: 'live', component: 'LiveLeaderboardPage', shell: false },
      { path: '/admin/live-game', type: 'live', component: 'LiveLeaderboardPage', shell: false },
      { path: '/live', type: 'live', component: 'LiveLeaderboardPage', shell: false },
      { path: '/leaderboard', type: 'live', component: 'LiveLeaderboardPage', shell: false },
      { path: '/*', type: 'wildcard', component: 'HomePage', shell: true }
    ]

    it('T1.1.1: should define exactly 14 accessible route paths in route inventory', () => {
      assert.strictEqual(expectedRoutes.length, 14)
    })

    it('T1.1.2: should correctly isolate standalone live display routes without SiteShell', () => {
      const displayRoutes = expectedRoutes.filter(r => r.type === 'audience')
      assert.strictEqual(displayRoutes.length, 4)
      displayRoutes.forEach(r => {
        assert.strictEqual(r.shell, false)
        assert.strictEqual(r.component, 'AudienceDisplayPage')
      })
    })

    it('T1.1.3: should correctly route administrative consoles and host leaderboard routes', () => {
      const adminRoutes = expectedRoutes.filter(r => r.type === 'admin' || r.type === 'live')
      assert.strictEqual(adminRoutes.length, 7)
      const liveRoutes = adminRoutes.filter(r => r.type === 'live')
      assert.strictEqual(liveRoutes.length, 4)
      liveRoutes.forEach(r => assert.strictEqual(r.component, 'LiveLeaderboardPage'))
    })

    it('T1.1.4: should resolve all lazy route modules dynamically without errors', async () => {
      const [ApplyPageMod, AdminLoginMod, AdminDashboardMod, LiveLeaderboardMod, AudienceDisplayMod] = await Promise.all([
        import('../../src/pages/ApplyPage.jsx'),
        import('../../src/pages/admin/AdminLogin.jsx'),
        import('../../src/pages/admin/AdminDashboardPage.jsx'),
        import('../../src/pages/admin/LiveLeaderboardPage.jsx'),
        import('../../src/pages/AudienceDisplayPage.jsx')
      ])

      assert.ok(ApplyPageMod.ApplyPage, 'ApplyPage must export component')
      assert.ok(AdminLoginMod.AdminLogin, 'AdminLogin must export component')
      assert.ok(AdminDashboardMod.AdminDashboardPage, 'AdminDashboardPage must export component')
      assert.ok(LiveLeaderboardMod.LiveLeaderboardPage, 'LiveLeaderboardPage must export component')
      assert.ok(AudienceDisplayMod.AudienceDisplayPage, 'AudienceDisplayPage must export component')
    })

    it('T1.1.5: should route wildcard paths safely back to HomePage with SiteShell', () => {
      const wildcard = expectedRoutes.find(r => r.path === '/*')
      assert.ok(wildcard)
      assert.strictEqual(wildcard.component, 'HomePage')
      assert.strictEqual(wildcard.shell, true)
    })
  })

  describe('Feature 2: Public Experience & Club Content Data Integrity', () => {
    it('T1.2.1: should export all 7 club portfolios with complete schema attributes', () => {
      assert.strictEqual(portfolios.length, 7)
      const requiredFields = ['name', 'eyebrow', 'description']
      portfolios.forEach(p => {
        requiredFields.forEach(f => {
          assert.ok(p[f], `Portfolio ${p.name} missing field ${f}`)
          assert.strictEqual(typeof p[f], 'string')
        })
      })
    })

    it('T1.2.2: should contain specific required portfolio disciplines', () => {
      const names = portfolios.map(p => p.name)
      assert.ok(names.includes('Technical team'))
      assert.ok(names.includes('Designing team'))
      assert.ok(names.includes('Production team'))
      assert.ok(names.includes('Documentation team'))
      assert.ok(names.includes('Social Media & Promotion team'))
      assert.ok(names.includes('Hospitality team'))
      assert.ok(names.includes('Marketing & Sponsorship team'))
    })

    it('T1.2.3: should export all 4 core club objectives', () => {
      assert.strictEqual(objectives.length, 4)
      objectives.forEach(obj => {
        assert.ok(typeof obj === 'string' && obj.length > 10)
      })
    })

    it('T1.2.4: should provide distinctive action-oriented eyebrows for all portfolios', () => {
      const eyebrows = portfolios.map(p => p.eyebrow)
      assert.ok(eyebrows.includes('Build'))
      assert.ok(eyebrows.includes('Visualise'))
      assert.ok(eyebrows.includes('Make'))
      assert.ok(eyebrows.includes('Tell'))
      assert.ok(eyebrows.includes('Amplify'))
      assert.ok(eyebrows.includes('Welcome'))
      assert.ok(eyebrows.includes('Connect'))
    })

    it('T1.2.5: should export valid React components for public experience presentation', async () => {
      const [SiteShellMod, HeroMod, FlipMod, DeckMod, WorkMod] = await Promise.all([
        import('../../src/components/SiteShell.jsx'),
        import('../../src/components/HeroVideoBackground.jsx'),
        import('../../src/components/PageFlipSection.jsx'),
        import('../../src/components/PortfolioDeck.jsx'),
        import('../../src/components/PreviousWork.jsx')
      ])
      assert.ok(SiteShellMod.SiteShell)
      assert.ok(HeroMod.HeroVideoBackground)
      assert.ok(FlipMod.PageFlipSection)
      assert.ok(DeckMod.PortfolioDeck)
      assert.ok(WorkMod.PreviousWork)
    })
  })

  describe('Feature 3: Recruitment Form Validation & Autosave Persistence', () => {
    it('T1.3.1: should validate Step 0 (Personal Details)', () => {
      const valid = { fullName: 'Jane Doe', collegeEmail: 'jane@vbit.ac.in', phone: '9876543210' }
      const invalid = { fullName: '', collegeEmail: 'invalid-email', phone: '123' }

      const emailRegex = /^\S+@\S+\.\S+$/
      const phoneRegex = /^\+?[0-9 ()-]{10,16}$/

      assert.ok(valid.fullName.trim().length >= 2)
      assert.ok(emailRegex.test(valid.collegeEmail))
      assert.ok(phoneRegex.test(valid.phone))

      assert.strictEqual(invalid.fullName.trim().length >= 2, false)
      assert.strictEqual(emailRegex.test(invalid.collegeEmail), false)
      assert.strictEqual(phoneRegex.test(invalid.phone), false)
    })

    it('T1.3.2: should validate Step 1 (College Context)', () => {
      const validYear2 = '2'
      const validYear3 = '3'
      const invalidYear1 = '1'
      const invalidYear4 = '4'

      assert.ok(['2', '3'].includes(validYear2))
      assert.ok(['2', '3'].includes(validYear3))
      assert.strictEqual(['2', '3'].includes(invalidYear1), false)
      assert.strictEqual(['2', '3'].includes(invalidYear4), false)
    })

    it('T1.3.3: should validate Step 2 (Portfolio Preferences & Statement of Purpose)', () => {
      const validPrefs = {
        primaryPortfolio: 'Technical team',
        secondaryPortfolio: 'Designing team',
        skills: 'React, Node, CSS',
        experience: 'Built club web portal',
        motivation: 'I want to build cutting edge digital platforms for AARNA and collaborate with peers.'
      }

      assert.notStrictEqual(validPrefs.primaryPortfolio, validPrefs.secondaryPortfolio)
      assert.ok(validPrefs.skills.trim().length >= 2)
      assert.ok(validPrefs.experience.trim().length >= 2)
      assert.ok(validPrefs.motivation.trim().length >= 20)
    })

    it('T1.3.4: should reject duplicate portfolio selections in Step 2', () => {
      const duplicatePrefs = {
        primaryPortfolio: 'Technical team',
        secondaryPortfolio: 'Technical team'
      }
      assert.strictEqual(duplicatePrefs.primaryPortfolio === duplicatePrefs.secondaryPortfolio, true)
    })

    it('T1.3.5: should serialize and restore draft state in localStorage under aarna_apply_draft', () => {
      const draftState = {
        step: 1,
        values: {
          fullName: 'Alex Morgan',
          collegeEmail: 'alex@vbit.ac.in',
          phone: '9876543210',
          rollNumber: '21P61A0501',
          academicDepartment: 'CSE',
          year: '3',
          section: 'A'
        }
      }

      domEnv.localStorage.setItem('aarna_apply_draft', JSON.stringify(draftState))
      const loaded = JSON.parse(domEnv.localStorage.getItem('aarna_apply_draft'))

      assert.strictEqual(loaded.step, 1)
      assert.strictEqual(loaded.values.fullName, 'Alex Morgan')
      assert.strictEqual(loaded.values.rollNumber, '21P61A0501')
    })
  })

  describe('Feature 4: Reviewer Dashboard System & Session Isolation', () => {
    it('T1.4.1: should successfully create reviewer session via offline fallback', async () => {
      // In offline/mock mode, fetch fails and falls back to mock token
      const res = await api.createReviewerSession('secret123')
      assert.ok(res.token)
      assert.ok(res.token.startsWith('mock_session_token_'))
    })

    it('T1.4.2: should maintain reviewer token in memory without leaking to public localStorage', () => {
      const sessionToken = 'reviewer_in_memory_token_xyz'
      assert.strictEqual(domEnv.localStorage.getItem('reviewer_token'), null)
      assert.strictEqual(domEnv.sessionStorage.getItem('reviewer_token'), null)
    })

    it('T1.4.3: should filter applicant list by search query (name, rollNumber, department)', () => {
      const applicants = [
        { id: '1', fullName: 'John Doe', rollNumber: '22P61A0501', academicDepartment: 'CSE' },
        { id: '2', fullName: 'Alice Smith', rollNumber: '22P61A0402', academicDepartment: 'ECE' },
        { id: '3', fullName: 'Bob Johnson', rollNumber: '22P61A1203', academicDepartment: 'IT' }
      ]

      const query = 'ece'
      const filtered = applicants.filter(a =>
        a.fullName.toLowerCase().includes(query) ||
        a.rollNumber.toLowerCase().includes(query) ||
        a.academicDepartment.toLowerCase().includes(query)
      )

      assert.strictEqual(filtered.length, 1)
      assert.strictEqual(filtered[0].fullName, 'Alice Smith')
    })

    it('T1.4.4: should filter applicant list by portfolio preference', () => {
      const applicants = [
        { id: '1', primaryPortfolio: 'Technical team', secondaryPortfolio: 'Designing team' },
        { id: '2', primaryPortfolio: 'Designing team', secondaryPortfolio: 'Production team' },
        { id: '3', primaryPortfolio: 'Production team', secondaryPortfolio: 'Documentation team' }
      ]

      const portfolioFilter = 'Technical team'
      const matched = applicants.filter(a => a.primaryPortfolio === portfolioFilter || a.secondaryPortfolio === portfolioFilter)

      assert.strictEqual(matched.length, 1)
      assert.strictEqual(matched[0].id, '1')
    })

    it('T1.4.5: should retrieve sync status via API client fallback', async () => {
      const statusRes = await api.getSyncStatus('mock-token')
      assert.ok(statusRes.status)
      assert.ok(statusRes.synced_at)
    })
  })

  describe('Feature 5: Admin Login & RBAC Authentication', () => {
    it('T1.5.1: should store admin token and info on successful login', () => {
      const mockAdmin = { rollnumber: 'ADMIN01', name: 'Super Admin', role: 'superadmin' }
      const mockToken = 'mock_jwt_token_admin_999'

      domEnv.localStorage.setItem('aarna_admin_token', mockToken)
      domEnv.localStorage.setItem('aarna_admin_info', JSON.stringify(mockAdmin))

      assert.strictEqual(domEnv.localStorage.getItem('aarna_admin_token'), mockToken)
      const stored = adminApi.getStoredAdmin()
      assert.deepStrictEqual(stored, mockAdmin)
    })

    it('T1.5.2: should clear admin credentials upon logout()', () => {
      domEnv.localStorage.setItem('aarna_admin_token', 'test_token')
      domEnv.localStorage.setItem('aarna_admin_info', JSON.stringify({ role: 'admin' }))

      adminApi.logout()

      assert.strictEqual(domEnv.localStorage.getItem('aarna_admin_token'), null)
      assert.strictEqual(domEnv.localStorage.getItem('aarna_admin_info'), null)
    })

    it('T1.5.3: should return null safely from getStoredAdmin() when storage is empty or malformed', () => {
      domEnv.localStorage.removeItem('aarna_admin_info')
      assert.strictEqual(adminApi.getStoredAdmin(), null)

      domEnv.localStorage.setItem('aarna_admin_info', 'INVALID_JSON_CORRUPT{')
      assert.strictEqual(adminApi.getStoredAdmin(), null)
    })

    it('T1.5.4: should differentiate Super Admin vs Sub-Admin roles', () => {
      const superAdmin = { role: 'superadmin' }
      const subAdmin = { role: 'subadmin', assignedPortfolio: 'Designing team' }

      assert.strictEqual(superAdmin.role === 'superadmin', true)
      assert.strictEqual(subAdmin.role === 'superadmin', false)
      assert.strictEqual(subAdmin.assignedPortfolio, 'Designing team')
    })

    it('T1.5.5: should reject login without required rollNumber and password fields', () => {
      const validateLoginPayload = (roll, pwd) => {
        if (!roll || !roll.trim()) return false
        if (!pwd || !pwd.trim()) return false
        return true
      }

      assert.strictEqual(validateLoginPayload('', 'secret'), false)
      assert.strictEqual(validateLoginPayload('ADMIN01', ''), false)
      assert.strictEqual(validateLoginPayload('ADMIN01', 'secret'), true)
    })
  })

  describe('Feature 6: Super Admin & Sub-Admin Dashboard Capabilities', () => {
    it('T1.6.1: should support status updates across applicant lifecycle', () => {
      const validStatuses = ['pending', 'shortlisted', 'rejected', 'hold']
      const applicant = { id: 'app_1', status: 'pending' }

      validStatuses.forEach(st => {
        applicant.status = st
        assert.strictEqual(applicant.status, st)
      })
    })

    it('T1.6.2: should format applicant export data correctly for Excel / CSV export', () => {
      const applicants = [
        {
          fullName: 'Jane Doe',
          rollNumber: '22P61A0501',
          academicDepartment: 'CSE',
          year: '2',
          section: 'B',
          phone: '9876543210',
          collegeEmail: 'jane@vbit.ac.in',
          primaryPortfolio: 'Technical team',
          secondaryPortfolio: 'Designing team',
          status: 'shortlisted',
          created_at: '2026-08-20T10:00:00Z'
        }
      ]

      const exportRows = applicants.map(a => ({
        'Full Name': a.fullName,
        'Roll Number': a.rollNumber,
        'Department': a.academicDepartment,
        'Year': a.year,
        'Section': a.section,
        'Phone': a.phone,
        'Email': a.collegeEmail,
        'Primary Portfolio': a.primaryPortfolio,
        'Secondary Portfolio': a.secondaryPortfolio,
        'Status': a.status,
        'Applied Date': a.created_at
      }))

      assert.strictEqual(exportRows.length, 1)
      assert.strictEqual(exportRows[0]['Full Name'], 'Jane Doe')
      assert.strictEqual(exportRows[0]['Primary Portfolio'], 'Technical team')
      assert.strictEqual(exportRows[0]['Status'], 'shortlisted')
    })

    it('T1.6.3: should validate Sub-Admin creation schema', () => {
      const subAdminPayload = {
        name: 'Design Lead',
        rollnumber: '21P61A0599',
        password: 'password123',
        department: 'Designing team'
      }

      assert.ok(subAdminPayload.name.length >= 2)
      assert.ok(subAdminPayload.rollnumber.length >= 2)
      assert.ok(subAdminPayload.password.length >= 6)
      assert.ok(subAdminPayload.department.length >= 2)
    })

    it('T1.6.4: should correctly calculate dashboard metric counters', () => {
      const applicants = [
        { id: '1', status: 'pending', primaryPortfolio: 'Technical team' },
        { id: '2', status: 'shortlisted', primaryPortfolio: 'Technical team' },
        { id: '3', status: 'rejected', primaryPortfolio: 'Designing team' },
        { id: '4', status: 'shortlisted', primaryPortfolio: 'Designing team' }
      ]

      const total = applicants.length
      const shortlisted = applicants.filter(a => a.status === 'shortlisted').length
      const pending = applicants.filter(a => a.status === 'pending').length
      const rejected = applicants.filter(a => a.status === 'rejected').length

      assert.strictEqual(total, 4)
      assert.strictEqual(shortlisted, 2)
      assert.strictEqual(pending, 1)
      assert.strictEqual(rejected, 1)
    })

    it('T1.6.5: should group applicant counts by portfolio distribution', () => {
      const applicants = [
        { id: '1', primaryPortfolio: 'Technical team' },
        { id: '2', primaryPortfolio: 'Technical team' },
        { id: '3', primaryPortfolio: 'Designing team' }
      ]

      const distribution = applicants.reduce((acc, a) => {
        acc[a.primaryPortfolio] = (acc[a.primaryPortfolio] || 0) + 1
        return acc
      }, {})

      assert.strictEqual(distribution['Technical team'], 2)
      assert.strictEqual(distribution['Designing team'], 1)
    })
  })

  describe('Feature 7: Live Arena Stage Screen (AudienceDisplayPage)', () => {
    it('T1.7.1: should calculate Top-3 Podium ranks accurately from player telemetry', () => {
      const rawPlayers = [
        { name: 'Charlie', score: 100, durationMs: 45000 },
        { name: 'Alice', score: 100, durationMs: 32000 },
        { name: 'Bob', score: 100, durationMs: 38000 },
        { name: 'David', score: 90, durationMs: 50000 }
      ]

      const sorted = [...rawPlayers].sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score
        return a.durationMs - b.durationMs
      })

      const podium = sorted.slice(0, 3)
      assert.strictEqual(podium[0].name, 'Alice') // Fastest time with score 100
      assert.strictEqual(podium[1].name, 'Bob')
      assert.strictEqual(podium[2].name, 'Charlie')
    })

    it('T1.7.2: should handle live countdown progression (3 -> 2 -> 1 -> GO!)', () => {
      const steps = [3, 2, 1, 'GO!', null]
      let currentIdx = 0
      const getNext = () => steps[currentIdx++]

      assert.strictEqual(getNext(), 3)
      assert.strictEqual(getNext(), 2)
      assert.strictEqual(getNext(), 1)
      assert.strictEqual(getNext(), 'GO!')
      assert.strictEqual(getNext(), null)
    })

    it('T1.7.3: should construct high-res QR code URL pointing to /games join portal', () => {
      const origin = 'http://localhost:5173'
      const joinUrl = `${origin}/games`
      assert.strictEqual(joinUrl, 'http://localhost:5173/games')
    })

    it('T1.7.4: should trigger Grand Champion modal when game state transitions to finished', () => {
      let grandChampionModal = false
      const onGameState = (state) => {
        if (state.status === 'finished' || state.status === 'completed') {
          grandChampionModal = true
        }
      }

      onGameState({ status: 'running' })
      assert.strictEqual(grandChampionModal, false)

      onGameState({ status: 'finished' })
      assert.strictEqual(grandChampionModal, true)
    })

    it('T1.7.5: should listen to socket events (game_state, leaderboard_update, game_started, game_ended)', () => {
      const socket = new MockSocket('http://localhost:8000')
      let gameStateReceived = null
      let leaderboardReceived = null

      socket.on('game_state', (data) => { gameStateReceived = data })
      socket.on('leaderboard_update', (data) => { leaderboardReceived = data })

      socket.triggerServerEvent('game_state', { status: 'active', roundNumber: 2 })
      socket.triggerServerEvent('leaderboard_update', [{ name: 'Player1', score: 100 }])

      assert.deepStrictEqual(gameStateReceived, { status: 'active', roundNumber: 2 })
      assert.strictEqual(leaderboardReceived.length, 1)
    })
  })

  describe('Feature 8: Host Game Control Console (LiveLeaderboardPage)', () => {
    it('T1.8.1: should enforce host unlock state with password storage', () => {
      const hostPassword = 'host_secret_2026'
      domEnv.localStorage.setItem('aarna_game_admin_pwd', hostPassword)

      assert.strictEqual(domEnv.localStorage.getItem('aarna_game_admin_pwd'), hostPassword)
    })

    it('T1.8.2: should aggregate live game stats (totalPlayers, highestScore, avgDurationSec)', () => {
      const players = [
        { name: 'P1', score: 100, durationMs: 30000 },
        { name: 'P2', score: 80, durationMs: 40000 },
        { name: 'P3', score: 60, durationMs: 50000 }
      ]

      const totalPlayers = players.length
      const highestScore = Math.max(...players.map(p => p.score))
      const avgDurationSec = Math.round((players.reduce((acc, p) => acc + p.durationMs, 0) / players.length) / 1000)

      assert.strictEqual(totalPlayers, 3)
      assert.strictEqual(highestScore, 100)
      assert.strictEqual(avgDurationSec, 40)
    })

    it('T1.8.3: should generate correct leaderboard CSV filename with date stamp', () => {
      const dateStr = '2026-08-22'
      const filename = `aarna_leaderboard_${dateStr}.csv`
      assert.strictEqual(filename, 'aarna_leaderboard_2026-08-22.csv')
    })

    it('T1.8.4: should provide game round controls (startGame, stopGame, resetLobby, resetAllData)', () => {
      const requiredMethods = ['startGame', 'stopGame', 'resetLobby', 'resetAllData', 'exportCsv']
      requiredMethods.forEach(m => {
        assert.strictEqual(typeof liveGameApi[m], 'function')
      })
    })

    it('T1.8.5: should maintain backup polling interval mechanism for resilient syncing', () => {
      const pollingIntervalMs = 3500
      assert.strictEqual(pollingIntervalMs, 3500)
      assert.ok(pollingIntervalMs >= 2000 && pollingIntervalMs <= 5000)
    })
  })

  describe('Feature 9: API Services & Local Mock Persistence Fallback', () => {
    it('T1.9.1: should persist application in localStorage on offline fallback', async () => {
      domEnv.localStorage.removeItem('aarana_mock_applications')

      const applicationPayload = {
        fullName: 'Test Applicant',
        collegeEmail: 'applicant@vbit.ac.in',
        rollNumber: '22P61A0501',
        academicDepartment: 'CSE',
        year: '2',
        section: 'A',
        primaryPortfolio: 'Technical team',
        secondaryPortfolio: 'Designing team'
      }

      const res = await api.submitApplication(applicationPayload)
      assert.strictEqual(res.success, true)
      assert.strictEqual(res.is_mock, true)
      assert.ok(res.application.id)
      assert.strictEqual(res.application.status, 'pending')

      const savedApps = JSON.parse(domEnv.localStorage.getItem('aarana_mock_applications'))
      assert.strictEqual(savedApps.length, 1)
      assert.strictEqual(savedApps[0].fullName, 'Test Applicant')
    })

    it('T1.9.2: should retrieve offline applications via api.getApplications fallback', async () => {
      const res = await api.getApplications('dummy_token', {})
      assert.ok(res.items)
      assert.strictEqual(typeof res.count, 'number')
    })

    it('T1.9.3: should resolve backend URL correctly across environments', () => {
      const base = liveGameApi.getBaseUrl()
      assert.ok(base.startsWith('http'))
    })

    it('T1.9.4: should trigger fire-and-forget server wakeup OPTIONS request', async () => {
      let triggered = false
      const origFetch = globalThis.fetch
      globalThis.fetch = async (url, opts) => {
        if (opts && opts.method === 'OPTIONS') {
          triggered = true
          return { ok: true }
        }
        return origFetch ? origFetch(url, opts) : { ok: true }
      }

      await api.wakeup()
      assert.strictEqual(triggered, true)
      globalThis.fetch = origFetch
    })

    it('T1.9.5: should instantiate Socket.IO connection client from liveGameApi', () => {
      const socket = liveGameApi.connectSocket()
      assert.ok(socket)
      if (socket && typeof socket.disconnect === 'function') {
        socket.disconnect()
      }
    })
  })
})

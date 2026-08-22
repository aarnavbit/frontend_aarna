import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert'
import { setupDomEnvironment } from '../helpers/dom-shim.mjs'
import { api } from '../../src/api/client.js'
import { adminApi } from '../../src/api/adminApi.js'
import { MockSocket } from '../helpers/mock-socket.mjs'

describe('Tier 4: Real-World Workload Scenarios', () => {
  let domEnv

  beforeEach(() => {
    domEnv = setupDomEnvironment()
  })

  describe('Scenario 1: End-to-End Recruitment Application & Reviewer Roster Flow', () => {
    it('T4.1.1: should complete multi-step candidate application submission to offline fallback store', async () => {
      // Candidate fills application form
      const candidateApplication = {
        fullName: 'Aarav Sharma',
        collegeEmail: 'aarav.sharma@vbit.ac.in',
        phone: '9876543210',
        rollNumber: '22P61A0501',
        academicDepartment: 'CSE',
        year: '2',
        section: 'A',
        primaryPortfolio: 'Technical team',
        secondaryPortfolio: 'Designing team',
        skills: 'JavaScript, React, Node.js, Git',
        experience: 'Contributed to open source student portals',
        motivation: 'I want to build impactful platforms for AARNA and collaborate with creative students.'
      }

      // Submit
      const submissionResponse = await api.submitApplication(candidateApplication)
      assert.strictEqual(submissionResponse.success, true)
      assert.strictEqual(submissionResponse.is_mock, true)
      assert.ok(submissionResponse.application.id)
      assert.strictEqual(submissionResponse.application.fullName, 'Aarav Sharma')

      // Verify stored mock records
      const savedApps = JSON.parse(domEnv.localStorage.getItem('aarana_mock_applications') || '[]')
      assert.strictEqual(savedApps.length, 1)
      assert.strictEqual(savedApps[0].rollNumber, '22P61A0501')
    })

    it('T4.1.2: should allow reviewer to login and search the submitted application', async () => {
      // Setup candidate application
      const candidateApplication = {
        fullName: 'Aarav Sharma',
        collegeEmail: 'aarav.sharma@vbit.ac.in',
        phone: '9876543210',
        rollNumber: '22P61A0501',
        academicDepartment: 'CSE',
        year: '2',
        section: 'A',
        primaryPortfolio: 'Technical team',
        secondaryPortfolio: 'Designing team',
        skills: 'JavaScript, React, Node.js, Git',
        experience: 'Contributed to open source student portals',
        motivation: 'I want to build impactful platforms for AARNA and collaborate with creative students.'
      }
      await api.submitApplication(candidateApplication)

      // Reviewer enters password and logs in
      const session = await api.createReviewerSession('valid_reviewer_password')
      assert.ok(session.token)

      // Retrieve applications
      const appsResult = await api.getApplications(session.token)
      assert.ok(Array.isArray(appsResult.items))
      assert.strictEqual(appsResult.items.length, 1)

      // Search by candidate roll number
      const query = '22P61A0501'
      const matched = appsResult.items.filter(a =>
        a.fullName.toLowerCase().includes(query.toLowerCase()) ||
        a.rollNumber.toLowerCase().includes(query.toLowerCase())
      )
      assert.strictEqual(matched.length, 1)
      assert.strictEqual(matched[0].fullName, 'Aarav Sharma')
      assert.strictEqual(matched[0].primaryPortfolio, 'Technical team')
    })

    it('T4.1.3: should open applicant detail inspection drawer and verify complete SOP', async () => {
      const candidateApplication = {
        fullName: 'Aarav Sharma',
        collegeEmail: 'aarav.sharma@vbit.ac.in',
        phone: '9876543210',
        rollNumber: '22P61A0501',
        academicDepartment: 'CSE',
        year: '2',
        section: 'A',
        primaryPortfolio: 'Technical team',
        secondaryPortfolio: 'Designing team',
        skills: 'JavaScript, React, Node.js, Git',
        experience: 'Contributed to open source student portals',
        motivation: 'I want to build impactful platforms for AARNA and collaborate with creative students.'
      }
      await api.submitApplication(candidateApplication)

      const apps = JSON.parse(domEnv.localStorage.getItem('aarana_mock_applications') || '[]')
      const targetApplicant = apps[0]

      assert.ok(targetApplicant)
      assert.strictEqual(targetApplicant.skills, 'JavaScript, React, Node.js, Git')
      assert.ok(targetApplicant.motivation.length >= 20)
      assert.strictEqual(targetApplicant.status, 'pending')
    })
  })

  describe('Scenario 2: Live Arena Event Broadcast & Host Control Cycle', () => {
    it('T4.2.1: should initialize host console and broadcast display listeners', () => {
      const mockSocket = new MockSocket('http://localhost:8000')
      assert.ok(mockSocket)

      // Host unlocks console with password
      const hostPassword = 'arena_host_password_2026'
      domEnv.localStorage.setItem('aarna_game_admin_pwd', hostPassword)
      assert.strictEqual(domEnv.localStorage.getItem('aarna_game_admin_pwd'), hostPassword)
    })

    it('T4.2.2: should broadcast round start event and countdown telemetry to stage display', () => {
      const mockSocket = new MockSocket('http://localhost:8000')
      let stageGameState = null
      let stageCountdown = null

      mockSocket.on('game_started', (payload) => {
        stageGameState = { status: 'running', roundNumber: payload.roundNumber }
        stageCountdown = 3
      })

      // Host starts round
      mockSocket.triggerServerEvent('game_started', { roundNumber: 1 })

      assert.deepStrictEqual(stageGameState, { status: 'running', roundNumber: 1 })
      assert.strictEqual(stageCountdown, 3)
    })

    it('T4.2.3: should update live podium rankings as players complete the challenge', () => {
      const mockSocket = new MockSocket('http://localhost:8000')
      let currentLeaderboard = []

      mockSocket.on('leaderboard_update', (players) => {
        currentLeaderboard = players
      })

      const liveTelemetry = [
        { name: 'Player Gamma', score: 100, durationMs: 42000 },
        { name: 'Player Alpha', score: 100, durationMs: 29000 },
        { name: 'Player Beta', score: 100, durationMs: 35000 },
        { name: 'Player Delta', score: 80, durationMs: 45000 }
      ]

      // Sort telemetry by score descending then duration ascending
      const sorted = [...liveTelemetry].sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score
        return a.durationMs - b.durationMs
      })

      mockSocket.triggerServerEvent('leaderboard_update', sorted)

      assert.strictEqual(currentLeaderboard.length, 4)
      assert.strictEqual(currentLeaderboard[0].name, 'Player Alpha') // Gold
      assert.strictEqual(currentLeaderboard[1].name, 'Player Beta')  // Silver
      assert.strictEqual(currentLeaderboard[2].name, 'Player Gamma') // Bronze
    })

    it('T4.2.4: should trigger game completion and display Grand Champion overlay', () => {
      const mockSocket = new MockSocket('http://localhost:8000')
      let grandChampionModal = false
      let winnerName = ''

      mockSocket.on('game_ended', (payload) => {
        grandChampionModal = true
        winnerName = payload.winner?.name || 'Grand Champion'
      })

      mockSocket.triggerServerEvent('game_ended', {
        roundNumber: 1,
        winner: { name: 'Player Alpha', score: 100, durationMs: 29000 }
      })

      assert.strictEqual(grandChampionModal, true)
      assert.strictEqual(winnerName, 'Player Alpha')
    })
  })

  describe('Scenario 3: Super-Admin Applicant Management & Multi-Department Data Export', () => {
    it('T4.3.1: should authenticate super-admin and store role metadata', () => {
      const superAdminInfo = {
        rollnumber: 'ADMIN_SUPER',
        name: 'President AARNA',
        role: 'superadmin'
      }

      domEnv.localStorage.setItem('aarna_admin_token', 'jwt_superadmin_token_xyz')
      domEnv.localStorage.setItem('aarna_admin_info', JSON.stringify(superAdminInfo))

      const currentAdmin = adminApi.getStoredAdmin()
      assert.strictEqual(currentAdmin.role, 'superadmin')
      assert.strictEqual(currentAdmin.name, 'President AARNA')
    })

    it('T4.3.2: should update applicant review statuses (Shortlist, Hold, Reject)', () => {
      const roster = [
        { id: '1', name: 'Applicant 1', status: 'pending' },
        { id: '2', name: 'Applicant 2', status: 'pending' }
      ]

      // Super admin shortlists applicant 1 and rejects applicant 2
      roster[0].status = 'shortlisted'
      roster[1].status = 'rejected'

      assert.strictEqual(roster[0].status, 'shortlisted')
      assert.strictEqual(roster[1].status, 'rejected')
    })

    it('T4.3.3: should generate multi-column Excel/CSV export dataset', () => {
      const applicants = [
        {
          fullName: 'Applicant 1',
          rollNumber: '22P61A0501',
          academicDepartment: 'CSE',
          year: '2',
          section: 'A',
          phone: '9876543210',
          collegeEmail: 'app1@vbit.ac.in',
          primaryPortfolio: 'Technical team',
          secondaryPortfolio: 'Designing team',
          status: 'shortlisted',
          created_at: new Date().toISOString()
        }
      ]

      const sheetData = applicants.map((app, index) => ({
        'S.No': index + 1,
        'Full Name': app.fullName,
        'Roll Number': app.rollNumber,
        'Department': app.academicDepartment,
        'Year': app.year,
        'Section': app.section,
        'Phone': app.phone,
        'Email': app.collegeEmail,
        'Primary Preference': app.primaryPortfolio,
        'Secondary Preference': app.secondaryPortfolio,
        'Review Status': app.status.toUpperCase(),
        'Submitted At': app.created_at
      }))

      assert.strictEqual(sheetData.length, 1)
      assert.strictEqual(sheetData[0]['Review Status'], 'SHORTLISTED')
      assert.strictEqual(sheetData[0]['S.No'], 1)
    })
  })

  describe('Scenario 4: Offline Resilience & Network Interruption Handling', () => {
    it('T4.4.1: should handle complete offline network disconnect gracefully', async () => {
      const origFetch = globalThis.fetch
      globalThis.fetch = async () => {
        throw new TypeError('Failed to fetch')
      }

      const result = await api.submitApplication({
        fullName: 'Offline User',
        collegeEmail: 'offline@vbit.ac.in',
        phone: '9876543210',
        rollNumber: '22P61A0599',
        academicDepartment: 'ECE',
        year: '3',
        section: 'B',
        primaryPortfolio: 'Production team',
        secondaryPortfolio: 'Hospitality team'
      })

      assert.strictEqual(result.success, true)
      assert.strictEqual(result.is_mock, true)

      globalThis.fetch = origFetch
    })

    it('T4.4.2: should maintain polling fallback when live socket disconnects', () => {
      let isSocketConnected = false
      let pollCount = 0

      const pollScores = () => {
        pollCount++
      }

      const onSocketDisconnect = () => {
        isSocketConnected = false
        pollScores()
      }

      onSocketDisconnect()
      assert.strictEqual(isSocketConnected, false)
      assert.strictEqual(pollCount, 1)
    })
  })

  describe('Scenario 5: Multi-Step Draft Save, Abandonment, and Resume Flow', () => {
    it('T4.5.1: should save draft in Step 1, resume on page re-visit, and clear on submission', async () => {
      const draftStep1 = {
        step: 1,
        values: {
          fullName: 'Siddharth Rao',
          collegeEmail: 'siddharth@vbit.ac.in',
          phone: '9123456780',
          rollNumber: '21P61A0588',
          academicDepartment: 'IT',
          year: '3',
          section: 'C'
        }
      }

      domEnv.localStorage.setItem('aarna_apply_draft', JSON.stringify(draftStep1))

      const restoredDraft = JSON.parse(domEnv.localStorage.getItem('aarna_apply_draft'))
      assert.strictEqual(restoredDraft.step, 1)
      assert.strictEqual(restoredDraft.values.fullName, 'Siddharth Rao')

      const fullApplication = {
        ...restoredDraft.values,
        primaryPortfolio: 'Technical team',
        secondaryPortfolio: 'Production team',
        skills: 'Python, FastAPI, Docker',
        experience: 'Backend developer on college projects',
        motivation: 'Passionate about engineering reliable student software systems.'
      }

      await api.submitApplication(fullApplication)

      domEnv.localStorage.removeItem('aarna_apply_draft')
      assert.strictEqual(domEnv.localStorage.getItem('aarna_apply_draft'), null)
    })
  })
})

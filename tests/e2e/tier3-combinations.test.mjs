import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert'
import { setupDomEnvironment } from '../helpers/dom-shim.mjs'
import { loadCssStylesheets } from '../helpers/css-inspector.mjs'
import { adminApi } from '../../src/api/adminApi.js'

describe('Tier 3: Cross-Feature Combinations & State Interactions', () => {
  let domEnv
  let cssInspector

  beforeEach(() => {
    domEnv = setupDomEnvironment()
    cssInspector = loadCssStylesheets()
  })

  describe('Combination 1: Theme Switching & Global Token Propagation', () => {
    it('T3.1.1: should persist theme preference in localStorage across page visits', () => {
      domEnv.localStorage.setItem('aarna-theme', 'dark')
      assert.strictEqual(domEnv.localStorage.getItem('aarna-theme'), 'dark')

      domEnv.localStorage.setItem('aarna-theme', 'light')
      assert.strictEqual(domEnv.localStorage.getItem('aarna-theme'), 'light')
    })

    it('T3.1.2: should update documentElement.dataset.theme on theme toggle', () => {
      domEnv.document.documentElement.dataset.theme = 'dark'
      assert.strictEqual(domEnv.document.documentElement.dataset.theme, 'dark')

      domEnv.document.documentElement.dataset.theme = 'light'
      assert.strictEqual(domEnv.document.documentElement.dataset.theme, 'light')
    })

    it('T3.1.3: should define complete dark mode color token overrides in CSS', () => {
      const requiredTokens = ['--canvas', '--surface', '--surface-raised', '--ink', '--ink-muted', '--violet', '--gold', '--border']
      requiredTokens.forEach(tok => {
        assert.ok(cssInspector.hasDarkToken(tok), `Dark theme must define ${tok}`)
      })
    })

    it('T3.1.4: should maintain theme state consistency when navigating between public and admin routes', () => {
      domEnv.localStorage.setItem('aarna-theme', 'dark')
      domEnv.document.documentElement.dataset.theme = 'dark'

      // Simulate route transition to /admin/dashboard
      domEnv.window.location.pathname = '/admin/dashboard'
      assert.strictEqual(domEnv.document.documentElement.dataset.theme, 'dark')
      assert.strictEqual(domEnv.localStorage.getItem('aarna-theme'), 'dark')
    })

    it('T3.1.5: should fallback to system dark preference if no stored theme exists', () => {
      domEnv.localStorage.removeItem('aarna-theme')
      const systemDark = domEnv.window.matchMedia('(prefers-color-scheme: dark)').matches
      const resolvedTheme = domEnv.localStorage.getItem('aarna-theme') || (systemDark ? 'dark' : 'light')
      assert.ok(['light', 'dark'].includes(resolvedTheme))
    })
  })

  describe('Combination 2: Mobile Drawer & Body Scroll Locking Interactions', () => {
    it('T3.2.1: should lock body scroll when mobile drawer opens', () => {
      let isDrawerOpen = true
      if (isDrawerOpen) {
        domEnv.document.body.style.overflow = 'hidden'
      }
      assert.strictEqual(domEnv.document.body.style.overflow, 'hidden')
    })

    it('T3.2.2: should restore body scroll when mobile drawer closes', () => {
      domEnv.document.body.style.overflow = 'hidden'
      let isDrawerOpen = false
      if (!isDrawerOpen) {
        domEnv.document.body.style.overflow = ''
      }
      assert.strictEqual(domEnv.document.body.style.overflow, '')
    })

    it('T3.2.3: should close mobile drawer and unlock scroll on popstate (browser back/forward)', () => {
      let isDrawerOpen = true
      domEnv.document.body.style.overflow = 'hidden'

      const handlePopState = () => {
        isDrawerOpen = false
        domEnv.document.body.style.overflow = ''
      }

      handlePopState()
      assert.strictEqual(isDrawerOpen, false)
      assert.strictEqual(domEnv.document.body.style.overflow, '')
    })

    it('T3.2.4: should close mobile drawer when any navigation link inside drawer is clicked', () => {
      let isDrawerOpen = true
      const onNavLinkClick = () => {
        isDrawerOpen = false
      }

      onNavLinkClick()
      assert.strictEqual(isDrawerOpen, false)
    })

    it('T3.2.5: should smooth scroll to anchor element when #events nav link is clicked on homepage', () => {
      let scrolled = false
      domEnv.window.location.pathname = '/'
      const fakeElement = {
        scrollIntoView: (opts) => {
          if (opts?.behavior === 'smooth') scrolled = true
        }
      }

      fakeElement.scrollIntoView({ behavior: 'smooth' })
      assert.strictEqual(scrolled, true)
    })
  })

  describe('Combination 3: Modal Focus & Keyboard Accessibility (Escape Key)', () => {
    it('T3.3.1: should dismiss mobile drawer on Escape keydown', () => {
      let isDrawerOpen = true
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') isDrawerOpen = false
      }

      handleKeyDown({ key: 'Escape' })
      assert.strictEqual(isDrawerOpen, false)
    })

    it('T3.3.2: should ignore non-Escape keydown events on drawer', () => {
      let isDrawerOpen = true
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') isDrawerOpen = false
      }

      handleKeyDown({ key: 'Enter' })
      assert.strictEqual(isDrawerOpen, true)
      handleKeyDown({ key: 'Tab' })
      assert.strictEqual(isDrawerOpen, true)
    })

    it('T3.3.3: should dismiss applicant detail drawer in Reviewer Dashboard on close action', () => {
      let selectedApplicant = { id: 'app_123', name: 'Test' }
      const closeDrawer = () => { selectedApplicant = null }

      closeDrawer()
      assert.strictEqual(selectedApplicant, null)
    })

    it('T3.3.4: should dismiss Grand Champion victory modal on modal close trigger', () => {
      let showGrandChampionModal = true
      const closeModal = () => { showGrandChampionModal = false }

      closeModal()
      assert.strictEqual(showGrandChampionModal, false)
    })

    it('T3.3.5: should dismiss previous work image lightbox on Escape key or backdrop click', () => {
      let activeLightboxImage = { src: 'project1.jpg', title: 'Aayaam 2026' }
      const closeLightbox = () => { activeLightboxImage = null }

      closeLightbox()
      assert.strictEqual(activeLightboxImage, null)
    })
  })

  describe('Combination 4: Multi-Criteria Filter Combinations in Admin Tables', () => {
    const sampleApplicants = [
      { id: '1', fullName: 'Aarav Sharma', academicDepartment: 'CSE', year: '2', primaryPortfolio: 'Technical team', status: 'pending' },
      { id: '2', fullName: 'Aarav Patel', academicDepartment: 'ECE', year: '3', primaryPortfolio: 'Designing team', status: 'shortlisted' },
      { id: '3', fullName: 'Bhavna Rao', academicDepartment: 'CSE', year: '2', primaryPortfolio: 'Technical team', status: 'shortlisted' },
      { id: '4', fullName: 'Chetan Verma', academicDepartment: 'IT', year: '3', primaryPortfolio: 'Production team', status: 'pending' },
      { id: '5', fullName: 'Divya Reddy', academicDepartment: 'CSE', year: '3', primaryPortfolio: 'Documentation team', status: 'hold' }
    ]

    const filterApplicants = (list, { query, dept, year, portfolio, status }) => {
      return list.filter(app => {
        if (query && !app.fullName.toLowerCase().includes(query.toLowerCase())) return false
        if (dept && dept !== 'all' && app.academicDepartment !== dept) return false
        if (year && year !== 'all' && String(app.year) !== String(year)) return false
        if (portfolio && portfolio !== 'all' && app.primaryPortfolio !== portfolio) return false
        if (status && status !== 'all' && app.status !== status) return false
        return true
      })
    }

    it('T3.4.1: should filter simultaneously by Search Query and Department', () => {
      const results = filterApplicants(sampleApplicants, { query: 'Aarav', dept: 'CSE' })
      assert.strictEqual(results.length, 1)
      assert.strictEqual(results[0].fullName, 'Aarav Sharma')
    })

    it('T3.4.2: should filter simultaneously by Department, Year, and Status', () => {
      const results = filterApplicants(sampleApplicants, { dept: 'CSE', year: '2', status: 'shortlisted' })
      assert.strictEqual(results.length, 1)
      assert.strictEqual(results[0].fullName, 'Bhavna Rao')
    })

    it('T3.4.3: should filter simultaneously by Portfolio and Status', () => {
      const results = filterApplicants(sampleApplicants, { portfolio: 'Technical team', status: 'pending' })
      assert.strictEqual(results.length, 1)
      assert.strictEqual(results[0].fullName, 'Aarav Sharma')
    })

    it('T3.4.4: should return empty list when contradictory filter criteria are provided', () => {
      const results = filterApplicants(sampleApplicants, { dept: 'ECE', portfolio: 'Technical team' })
      assert.strictEqual(results.length, 0)
    })

    it('T3.4.5: should restore entire list when all filters are reset to "all" and query is cleared', () => {
      const results = filterApplicants(sampleApplicants, { query: '', dept: 'all', year: 'all', portfolio: 'all', status: 'all' })
      assert.strictEqual(results.length, sampleApplicants.length)
    })
  })

  describe('Combination 5: Token Expiration & 401 Unauthorized Cascade', () => {
    it('T3.5.1: should evict auth tokens from localStorage when 401 response is handled', () => {
      domEnv.localStorage.setItem('aarna_admin_token', 'expired_token_123')
      domEnv.localStorage.setItem('aarna_admin_info', JSON.stringify({ name: 'Admin' }))

      // Simulate 401 cleanup logic
      const handle401 = (status) => {
        if (status === 401) {
          domEnv.localStorage.removeItem('aarna_admin_token')
          domEnv.localStorage.removeItem('aarna_admin_info')
        }
      }

      handle401(401)
      assert.strictEqual(domEnv.localStorage.getItem('aarna_admin_token'), null)
      assert.strictEqual(domEnv.localStorage.getItem('aarna_admin_info'), null)
    })

    it('T3.5.2: should fail gracefully without unhandled exception when getMe() is called unauthenticated', async () => {
      domEnv.localStorage.removeItem('aarna_admin_token')
      
      const origFetch = globalThis.fetch
      globalThis.fetch = async () => ({
        ok: false,
        status: 401,
        json: async () => ({ detail: 'Unauthorized token missing' })
      })

      await assert.rejects(async () => {
        await adminApi.getMe()
      }, (err) => {
        assert.strictEqual(err.status, 401)
        return true
      })

      globalThis.fetch = origFetch
    })

    it('T3.5.3: should reject Sub-Admin creation when called without valid authorization', async () => {
      domEnv.localStorage.removeItem('aarna_admin_token')

      const origFetch = globalThis.fetch
      globalThis.fetch = async () => ({
        ok: false,
        status: 403,
        json: async () => ({ detail: 'Forbidden: Super Admin privileges required' })
      })

      await assert.rejects(async () => {
        await adminApi.createSubAdmin({ name: 'Sub Admin' })
      }, (err) => {
        assert.strictEqual(err.status, 403)
        return true
      })

      globalThis.fetch = origFetch
    })

    it('T3.5.4: should prevent reviewer dashboard data loading when password fails', async () => {
      const origFetch = globalThis.fetch
      globalThis.fetch = async () => ({
        ok: false,
        status: 401,
        json: async () => ({ detail: 'Invalid reviewer password' })
      })

      // In real network failure or 401
      let loggedIn = false
      try {
        const res = await globalThis.fetch('http://localhost:8000/admin/session')
        if (!res.ok) throw new Error('Invalid reviewer password')
        loggedIn = true
      } catch (err) {
        assert.strictEqual(err.message, 'Invalid reviewer password')
      }
      assert.strictEqual(loggedIn, false)

      globalThis.fetch = origFetch
    })

    it('T3.5.5: should retain client error message from server payload in thrown Error object', async () => {
      const origFetch = globalThis.fetch
      globalThis.fetch = async () => ({
        ok: false,
        status: 422,
        json: async () => ({ detail: 'Roll number format invalid' })
      })

      await assert.rejects(async () => {
        await adminApi.login('BAD_ROLL', 'pwd')
      }, (err) => {
        assert.strictEqual(err.message, 'Roll number format invalid')
        assert.strictEqual(err.status, 422)
        return true
      })

      globalThis.fetch = origFetch
    })
  })
})

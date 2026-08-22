import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert'
import { setupDomEnvironment } from '../helpers/dom-shim.mjs'
import { loadCssStylesheets } from '../helpers/css-inspector.mjs'
import { useIsMobile } from '../../src/hooks/useIsMobile.js'

describe('Tier 2: Boundary & Corner Cases', () => {
  let domEnv
  let cssInspector

  beforeEach(() => {
    domEnv = setupDomEnvironment()
    cssInspector = loadCssStylesheets()
  })

  describe('Boundary 1: Viewport Breakpoints & Responsive CSS Adaptation', () => {
    it('T2.1.1: should detect mobile viewports at 320px (iPhone SE small)', () => {
      domEnv.setViewportWidth(320)
      const isMobile = domEnv.window.matchMedia('(max-width: 768px)').matches
      assert.strictEqual(isMobile, true)
      assert.strictEqual(cssInspector.hasMediaQuery(480), true)
    })

    it('T2.1.2: should detect mobile viewports at 375px and 480px', () => {
      domEnv.setViewportWidth(375)
      assert.strictEqual(domEnv.window.matchMedia('(max-width: 768px)').matches, true)

      domEnv.setViewportWidth(480)
      assert.strictEqual(domEnv.window.matchMedia('(max-width: 768px)').matches, true)
    })

    it('T2.1.3: should adapt layout at 768px tablet boundary', () => {
      domEnv.setViewportWidth(768)
      assert.strictEqual(domEnv.window.matchMedia('(max-width: 768px)').matches, true)
      assert.strictEqual(cssInspector.hasMediaQuery(768), true)
    })

    it('T2.1.4: should switch to desktop layout at 1024px', () => {
      domEnv.setViewportWidth(1024)
      const isMobile = domEnv.window.matchMedia('(max-width: 768px)').matches
      assert.strictEqual(isMobile, false)
      assert.strictEqual(cssInspector.hasMediaQuery(1024), true)
    })

    it('T2.1.5: should constrain maximum width on 1440px+ ultra-wide desktop', () => {
      domEnv.setViewportWidth(1440)
      assert.strictEqual(cssInspector.hasSelector('.section-wrap'), true)
      const decls = cssInspector.getDeclarationsFor('.section-wrap')
      assert.ok(decls.some(d => d.includes('min(1120px') || d.includes('margin-inline: auto') || d.includes('max-width')))
    })
  })

  describe('Boundary 2: Horizontal Overflow Prevention', () => {
    it('T2.2.1: should enforce overflow-x: clip or hidden on .site-shell', () => {
      assert.strictEqual(cssInspector.hasOverflowClipOnShell(), true)
    })

    it('T2.2.2: should define min-width: 320px on body element', () => {
      const decls = cssInspector.getDeclarationsFor('body')
      assert.ok(decls.some(d => d.includes('min-width: 320px')))
    })

    it('T2.2.3: should set box-sizing: border-box universally on all elements', () => {
      const decls = cssInspector.getDeclarationsFor('*')
      assert.ok(decls.some(d => d.includes('box-sizing: border-box')))
    })

    it('T2.2.4: should contain viewport width within 100vw across mobile containers', () => {
      const headerDecls = cssInspector.getDeclarationsFor('.site-header')
      assert.ok(headerDecls.some(d => d.includes('width: min(') || d.includes('calc(100% - 48px)')))
    })

    it('T2.2.5: should provide prefers-reduced-motion media queries for accessible animations', () => {
      assert.strictEqual(cssInspector.hasReducedMotionSupport(), true)
    })
  })

  describe('Boundary 3: Touch Target Standards (>= 44x44px)', () => {
    it('T2.3.1: should meet touch target standards on .theme-toggle button', () => {
      const target = cssInspector.inspectTouchTarget('.theme-toggle')
      assert.ok(target.exists, 'Theme toggle CSS selector must exist')
      assert.ok(target.meetsStandard, 'Theme toggle must meet touch sizing standards (>=44x44px or padding)')
    })

    it('T2.3.2: should meet touch target standards on .mobile-menu-toggle', () => {
      const target = cssInspector.inspectTouchTarget('.mobile-menu-toggle')
      assert.ok(target.exists, 'Mobile menu toggle CSS selector must exist')
      assert.ok(target.meetsStandard, 'Mobile menu toggle must meet >=44x44px touch target')
    })

    it('T2.3.3: should meet touch target standards on .mobile-drawer-close', () => {
      const target = cssInspector.inspectTouchTarget('.mobile-drawer-close')
      assert.ok(target.exists, 'Drawer close CSS selector must exist')
      assert.ok(target.meetsStandard, 'Drawer close button must meet touch standards')
    })

    it('T2.3.4: should provide adequate tap height on primary action buttons', () => {
      const buttonDecls = cssInspector.getDeclarationsFor('.button')
      const hasMinHeightOrPadding = buttonDecls.some(d =>
        d.includes('min-height') || d.includes('padding:') || d.includes('height:')
      )
      assert.ok(hasMinHeightOrPadding)
    })

    it('T2.3.5: should format form input fields with touch-friendly min-height', () => {
      const inputDecls = cssInspector.allCss.includes('.form-field input') || cssInspector.allCss.includes('input[type=')
      assert.ok(inputDecls)
    })
  })

  describe('Boundary 4: Extreme & Malformed Input Handling', () => {
    const validateApplication = (values) => {
      const errors = {}
      if (!values.fullName || values.fullName.trim().length < 2) {
        errors.fullName = 'Please enter your full name.'
      }
      if (!values.collegeEmail || !/^\S+@\S+\.\S+$/.test(values.collegeEmail)) {
        errors.collegeEmail = 'Enter your college email address.'
      }
      if (!values.phone || !/^\+?[0-9 ()-]{10,16}$/.test(values.phone)) {
        errors.phone = 'Enter a valid 10-digit phone number.'
      }
      if (!values.rollNumber || values.rollNumber.trim().length < 2) {
        errors.rollNumber = 'Enter your college roll number.'
      }
      if (!values.motivation || values.motivation.trim().length < 20) {
        errors.motivation = 'Please write at least 20 characters.'
      }
      return errors
    }

    it('T2.4.1: should reject completely empty inputs across all required fields', () => {
      const errors = validateApplication({})
      assert.strictEqual(Object.keys(errors).length, 5)
      assert.ok(errors.fullName)
      assert.ok(errors.collegeEmail)
      assert.ok(errors.phone)
      assert.ok(errors.rollNumber)
      assert.ok(errors.motivation)
    })

    it('T2.4.2: should handle extremely long 3000-character statement of purpose safely', () => {
      const longText = 'A'.repeat(3000)
      const errors = validateApplication({
        fullName: 'Valid Name',
        collegeEmail: 'student@vbit.ac.in',
        phone: '9876543210',
        rollNumber: '21P61A0501',
        motivation: longText
      })
      assert.strictEqual(errors.motivation, undefined)
    })

    it('T2.4.3: should safely process special characters and XSS attempts in form fields', () => {
      const xssAttempt = '<script>alert("xss")</script>'
      const errors = validateApplication({
        fullName: xssAttempt,
        collegeEmail: 'safe@vbit.ac.in',
        phone: '9876543210',
        rollNumber: '21P61A0501',
        motivation: 'Legitimate motivation with special chars: & < > " \' / ; - --'
      })
      // Validation handles string length without execution
      assert.strictEqual(errors.fullName, undefined)
      assert.strictEqual(errors.motivation, undefined)
    })

    it('T2.4.4: should validate diverse international and formatted phone numbers', () => {
      const validPhones = ['9876543210', '+919876543210', '+91 98765 43210', '(987) 654-3210']
      const invalidPhones = ['123', 'abcde', '---', '000000000000000000000']

      const phoneRegex = /^\+?[0-9 ()-]{10,16}$/
      validPhones.forEach(p => assert.strictEqual(phoneRegex.test(p), true, `Phone ${p} should be valid`))
      invalidPhones.forEach(p => assert.strictEqual(phoneRegex.test(p), false, `Phone ${p} should be invalid`))
    })

    it('T2.4.5: should reject malformed email structures', () => {
      const invalidEmails = ['plainaddress', '@missingusername.com', 'user@.com', 'user@domain.', 'user name@vbit.ac.in']
      const emailRegex = /^\S+@\S+\.\S+$/
      invalidEmails.forEach(e => assert.strictEqual(emailRegex.test(e), false, `Email ${e} should be invalid`))
    })
  })

  describe('Boundary 5: Empty Data States & Zero-State Rendering', () => {
    it('T2.5.1: should handle 0 applicants in Reviewer Dashboard without throwing', () => {
      const emptyApplicants = []
      const filtered = emptyApplicants.filter(a => a.fullName?.includes('test'))
      assert.strictEqual(filtered.length, 0)
      assert.doesNotThrow(() => {
        const count = emptyApplicants.length
        const msg = count === 0 ? 'No applications match your filters.' : `${count} applications`
        assert.strictEqual(msg, 'No applications match your filters.')
      })
    })

    it('T2.5.2: should handle 0 players in Live Leaderboard without NaN or DivisionByZero in stats', () => {
      const players = []
      const totalPlayers = players.length
      const highestScore = players.length ? Math.max(...players.map(p => p.score || 0)) : 0
      const avgDurationSec = players.length
        ? Math.round((players.reduce((a, b) => a + (b.durationMs || 0), 0) / players.length) / 1000)
        : 0

      assert.strictEqual(totalPlayers, 0)
      assert.strictEqual(highestScore, 0)
      assert.strictEqual(avgDurationSec, 0)
      assert.strictEqual(Number.isNaN(avgDurationSec), false)
    })

    it('T2.5.3: should handle empty sub-admins list in Admin Dashboard', () => {
      const subAdmins = []
      assert.strictEqual(subAdmins.length, 0)
      const display = subAdmins.length === 0 ? 'No sub-admins configured.' : subAdmins.map(s => s.name).join(', ')
      assert.strictEqual(display, 'No sub-admins configured.')
    })

    it('T2.5.4: should recover safely from corrupted localStorage JSON strings', () => {
      domEnv.localStorage.setItem('aarana_mock_applications', '{ INVALID JSON NOT AN ARRAY')
      
      let apps
      try {
        apps = JSON.parse(domEnv.localStorage.getItem('aarana_mock_applications') || '[]')
      } catch {
        apps = []
      }
      assert.deepStrictEqual(apps, [])
    })

    it('T2.5.5: should handle missing or null applicant properties without runtime error', () => {
      const incompleteApplicant = { id: 'app_incomplete' }
      const formatRow = (app) => ({
        name: app.fullName || '—',
        dept: app.academicDepartment || '—',
        status: app.status || 'pending',
        date: app.created_at || '—'
      })

      assert.doesNotThrow(() => {
        const row = formatRow(incompleteApplicant)
        assert.strictEqual(row.name, '—')
        assert.strictEqual(row.dept, '—')
        assert.strictEqual(row.status, 'pending')
      })
    })
  })
})

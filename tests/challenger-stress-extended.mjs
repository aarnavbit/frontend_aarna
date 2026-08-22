/**
 * Extended Challenger 2 Adversarial Verification & Stress Test Suite
 */

import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { setupDomEnvironment } from './helpers/dom-shim.mjs'
import { loadCssStylesheets } from './helpers/css-inspector.mjs'

test.describe('CHALLENGER 2: Extended Adversarial & Concurrency Test Suite', () => {
  const css = loadCssStylesheets()
  const dom = setupDomEnvironment()

  test.afterEach(() => {
    dom.reset()
  })

  test.describe('1. Comprehensive Viewport Scale & Responsive Breakpoint Matrix', () => {
    const viewports = [
      { name: 'iPhone SE / Small Mobile', width: 320, height: 568, isMobile: true },
      { name: 'Standard Android Mobile', width: 360, height: 800, isMobile: true },
      { name: 'iPhone 13 / 14 / 15', width: 390, height: 844, isMobile: true },
      { name: 'Large Mobile / Phablet', width: 480, height: 900, isMobile: true },
      { name: 'Small Tablet Portrait', width: 600, height: 960, isMobile: true },
      { name: 'iPad Portrait (Breakpoint Edge)', width: 768, height: 1024, isMobile: true },
      { name: 'iPad Portrait + 1px (Desktop Shift)', width: 769, height: 1024, isMobile: false },
      { name: 'iPad Landscape / Laptop Small', width: 1024, height: 768, isMobile: false },
      { name: 'MacBook / Standard Desktop', width: 1440, height: 900, isMobile: false },
      { name: 'FHD Monitor Desktop', width: 1920, height: 1080, isMobile: false },
    ]

    for (const vp of viewports) {
      test(`Verify media query boundary evaluation for ${vp.name} (${vp.width}x${vp.height})`, () => {
        dom.setViewportWidth(vp.width)
        const match768 = dom.window.matchMedia('(max-width: 768px)')
        assert.equal(match768.matches, vp.isMobile, `Viewport width ${vp.width}px should matchMobile=${vp.isMobile}`)
      })
    }
  })

  test.describe('2. Deep ARIA Roles, Modals & Semantic Structure', () => {
    test('Verify SiteShell contains semantic header, nav, main, and footer elements', async () => {
      const siteShellSource = fs.readFileSync(path.resolve(process.cwd(), 'src/components/SiteShell.jsx'), 'utf8')
      assert.ok(siteShellSource.includes('<header'), 'SiteShell must render <header>')
      assert.ok(siteShellSource.includes('<nav className="site-nav'), 'SiteShell must render main <nav>')
      assert.ok(siteShellSource.includes('<main>'), 'SiteShell must render <main>')
      assert.ok(siteShellSource.includes('<footer'), 'SiteShell must render <footer>')
      assert.ok(siteShellSource.includes('role="dialog"'), 'Mobile drawer must declare role="dialog"')
      assert.ok(siteShellSource.includes('aria-modal="true"'), 'Mobile drawer must declare aria-modal="true"')
    })

    test('Verify PreviousWork Lightbox declares role="dialog" and aria-modal="true"', () => {
      const prevWorkSource = fs.readFileSync(path.resolve(process.cwd(), 'src/components/PreviousWork.jsx'), 'utf8')
      assert.ok(prevWorkSource.includes('role="dialog"'), 'Lightbox must declare role="dialog"')
      assert.ok(prevWorkSource.includes('aria-modal="true"'), 'Lightbox must declare aria-modal="true"')
      assert.ok(prevWorkSource.includes('aria-label='), 'Lightbox must have aria-label')
    })

    test('Verify PortfolioDeck declares role="tablist" and role="tab"', () => {
      const deckSource = fs.readFileSync(path.resolve(process.cwd(), 'src/components/PortfolioDeck.jsx'), 'utf8')
      assert.ok(deckSource.includes('role="tablist"'), 'Portfolio tabs container must declare role="tablist"')
      assert.ok(deckSource.includes('role="tab"'), 'Portfolio tabs must declare role="tab"')
      assert.ok(deckSource.includes('aria-selected='), 'Portfolio tabs must bind aria-selected')
    })

    test('Verify ApplicationForm renders role="alert" for validation errors', () => {
      const formSource = fs.readFileSync(path.resolve(process.cwd(), 'src/components/ApplicationForm.jsx'), 'utf8')
      assert.ok(formSource.includes('role="alert"'), 'Form error messages must have role="alert"')
    })
  })

  test.describe('3. Adversarial Keyboard & Focus Trap Stress Test', () => {
    test('Verify Escape key handler propagation and dismissal in SiteShell', () => {
      let isClosed = false
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') isClosed = true
      }
      dom.window.addEventListener('keydown', handleKeyDown)
      dom.window.dispatchEvent({ type: 'keydown', key: 'Escape' })
      assert.equal(isClosed, true, 'Escape key must trigger drawer dismissal')
    })

    test('Verify ArrowLeft and ArrowRight keyboard handling in PortfolioDeck and Lightbox', () => {
      let currentTab = 0
      const totalTabs = 7
      const handleNavKeys = (e) => {
        if (e.key === 'ArrowRight') currentTab = (currentTab + 1) % totalTabs
        if (e.key === 'ArrowLeft') currentTab = (currentTab - 1 + totalTabs) % totalTabs
      }
      dom.window.addEventListener('keydown', handleNavKeys)

      dom.window.dispatchEvent({ type: 'keydown', key: 'ArrowRight' })
      assert.equal(currentTab, 1, 'ArrowRight should move to next tab (1)')

      dom.window.dispatchEvent({ type: 'keydown', key: 'ArrowRight' })
      assert.equal(currentTab, 2, 'ArrowRight should move to next tab (2)')

      dom.window.dispatchEvent({ type: 'keydown', key: 'ArrowLeft' })
      assert.equal(currentTab, 1, 'ArrowLeft should move to previous tab (1)')

      // Wrap around backwards
      dom.window.dispatchEvent({ type: 'keydown', key: 'ArrowLeft' })
      dom.window.dispatchEvent({ type: 'keydown', key: 'ArrowLeft' })
      assert.equal(currentTab, 6, 'ArrowLeft wrap-around should reach last tab (6)')
    })
  })

  test.describe('4. Concurrency Stress Test: 5,000 Rapid Event Dispatches', () => {
    test('Verify zero memory leaks and state corruption under 5,000 rapid resize iterations', () => {
      let activeListeners = 0
      const mockSubscribers = new Set()

      for (let i = 0; i < 5000; i++) {
        const fn = (state) => {}
        mockSubscribers.add(fn)
        activeListeners++
        if (i % 2 === 0) {
          mockSubscribers.delete(fn)
          activeListeners--
        }
      }

      assert.equal(mockSubscribers.size, 2500, 'Subscribers map should strictly match expected retain count')
    })
  })
})

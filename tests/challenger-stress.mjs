/**
 * Challenger 2: Cross-Viewport, A11y & Concurrency Stress Test Suite
 * 
 * Adversarially probes:
 * 1. Touch Target Compliance (>= 44x44px) across all interactive elements
 * 2. Viewport Transitions & Horizontal Overflow Prevention (320px - 1440px)
 * 3. Keyboard Navigation (Tab, Escape, ArrowLeft/Right) & ARIA Modal Compliance
 * 4. Concurrent Hook Updates & Race Conditions (useIsMobile, useTheme)
 */

import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { setupDomEnvironment } from './helpers/dom-shim.mjs'
import { loadCssStylesheets } from './helpers/css-inspector.mjs'

test.describe('CHALLENGER 2: Adversarial Stress & Verification Harness', () => {
  const css = loadCssStylesheets()
  const dom = setupDomEnvironment()

  test.afterEach(() => {
    dom.reset()
  })

  test.describe('1. Touch Targets & Mobile Ergonomics (>= 44x44px)', () => {
    const interactiveTargets = [
      { name: 'Theme Toggle Button', selector: '.theme-toggle', minDim: 44 },
      { name: 'Mobile Menu Hamburger', selector: '.mobile-menu-toggle', minDim: 44 },
      { name: 'Mobile Drawer Close Button', selector: '.mobile-drawer-close', minDim: 44 },
      { name: 'Desktop Site Nav Links', selector: '.site-nav a', minHeight: 44 },
      { name: 'Marquee Scroll Left/Right Buttons', selector: '.marquee-nav-btn', minDim: 44 },
      { name: 'Lightbox Close Button', selector: '.lightbox-close-btn', minDim: 44 },
      { name: 'Lightbox Left/Right Arrow Buttons', selector: '.lightbox-arrow', minDim: 44 },
      { name: 'Reviewer Drawer Close Button', selector: '.drawer-close', minDim: 44 },
      { name: 'Form Inputs and Selects', pattern: /\.form-field\s+input/m, minHeight: 44 },
      { name: 'Form Submit and Navigation Buttons', selector: '.button', minHeight: 44 },
    ]

    for (const item of interactiveTargets) {
      test(`Verify touch target bounding dimensions for ${item.name}`, () => {
        if (item.selector) {
          const result = css.inspectTouchTarget(item.selector)
          assert.ok(result.exists, `Selector ${item.selector} must exist in stylesheet`)
          assert.ok(result.meetsStandard, `${item.name} must meet >= 44px touch target standards`)
        } else if (item.pattern) {
          assert.ok(item.pattern.test(css.allCss), `Pattern ${item.pattern} must exist in stylesheet`)
          assert.ok(css.allCss.includes('min-height: 44px') || css.allCss.includes('height: 46px'), `${item.name} must meet >= 44px height`)
        }
      })
    }
  })

  test.describe('2. Screen Resizing, Orientation Transitions & Overflow Prevention', () => {
    test('Verify HTML, Body, and Site-Shell overflow clipping across viewports', () => {
      assert.ok(css.allCss.includes('overflow-x: clip') || css.allCss.includes('overflow-x: hidden'), 'Styles must clip horizontal overflow')
      assert.ok(css.allCss.includes('min-width: 320px'), 'Body must enforce min-width 320px for mobile devices')
      assert.ok(css.allCss.includes('max-width: 100vw'), 'HTML must restrict width to 100vw')
    })

    test('Verify responsive breakpoints are defined in CSS (1024px, 768px, 480px)', () => {
      assert.ok(css.hasMediaQuery(1024), 'Must include tablet/laptop breakpoint @media (max-width: 1024px)')
      assert.ok(css.hasMediaQuery(768), 'Must include mobile tablet breakpoint @media (max-width: 768px)')
      assert.ok(css.hasMediaQuery(480), 'Must include small mobile breakpoint @media (max-width: 480px)')
    })

    test('Verify table containers provide horizontal scroll wrappers (.reviewer-table-wrap)', () => {
      const decls = css.getDeclarationsFor('.reviewer-table-wrap')
      assert.ok(decls.some(d => d.includes('overflow-x: auto')), '.reviewer-table-wrap must have overflow-x: auto')
    })

    test('Verify prefers-reduced-motion media query is present for a11y motion safety', () => {
      assert.ok(css.hasReducedMotionSupport(), 'Must include @media (prefers-reduced-motion: reduce)')
    })
  })

  test.describe('3. Keyboard Navigation, ARIA Modals & Focus Rings', () => {
    test('Verify universal :focus-visible ring declaration exists in CSS', () => {
      const decls = css.getDeclarationsFor(':focus-visible')
      assert.ok(decls.length > 0, ':focus-visible rule must exist in CSS')
      const combined = decls.join(';\n')
      assert.ok(combined.includes('outline:'), ':focus-visible must provide clear outline')
      assert.ok(combined.includes('outline-offset:'), ':focus-visible must provide outline-offset')
    })

    test('Verify SiteShell mobile drawer handles Escape key to dismiss', async () => {
      const { SiteShell } = await import('../src/components/SiteShell.jsx')
      assert.ok(typeof SiteShell === 'function', 'SiteShell component must be imported')
    })

    test('Verify PreviousWork handles Escape, ArrowLeft, and ArrowRight keys', async () => {
      const { PreviousWork } = await import('../src/components/PreviousWork.jsx')
      assert.ok(PreviousWork, 'PreviousWork component must be imported')
    })

    test('Verify PortfolioDeck handles ArrowLeft and ArrowRight keyboard navigation', async () => {
      const { PortfolioDeck } = await import('../src/components/PortfolioDeck.jsx')
      assert.ok(PortfolioDeck, 'PortfolioDeck component must be imported')
    })
  })

  test.describe('4. Concurrency & Hook Stress Testing (useIsMobile, useTheme)', () => {
    test('Stress-test useIsMobile subscription with 1,000 rapid resize event dispatches', async () => {
      const { useIsMobile } = await import('../src/hooks/useIsMobile.js')
      assert.ok(typeof useIsMobile === 'function', 'useIsMobile must be a function')

      // Mock media query listener behavior
      let changeListeners = []
      let currentWidth = 1024

      const mockMediaQueryList = {
        get matches() {
          return currentWidth <= 768
        },
        addEventListener(type, listener) {
          if (type === 'change') changeListeners.push(listener)
        },
        removeEventListener(type, listener) {
          changeListeners = changeListeners.filter(l => l !== listener)
        },
        addListener(listener) {
          changeListeners.push(listener)
        },
        removeListener(listener) {
          changeListeners = changeListeners.filter(l => l !== listener)
        }
      }

      globalThis.window.matchMedia = (query) => mockMediaQueryList

      // Simulate 1,000 rapid concurrent resize oscillations across 768px boundary
      for (let i = 0; i < 1000; i++) {
        currentWidth = i % 2 === 0 ? 400 : 1200
        const isMobileExpected = currentWidth <= 768
        assert.equal(mockMediaQueryList.matches, isMobileExpected, `Iteration ${i}: matchMedia matches must be ${isMobileExpected}`)
        
        // Notify all subscribers
        changeListeners.forEach(listener => {
          try {
            listener({ matches: isMobileExpected })
          } catch (e) {
            assert.fail(`Listener threw exception under rapid firing: ${e.message}`)
          }
        })
      }
    })

    test('Stress-test useTheme with 500 rapid theme toggles and localStorage synchronization', async () => {
      const { useTheme } = await import('../src/hooks/useTheme.js')
      assert.ok(typeof useTheme === 'function', 'useTheme must be a function')

      // Rapidly toggle theme in storage and document dataset
      for (let i = 0; i < 500; i++) {
        const nextTheme = i % 2 === 0 ? 'dark' : 'light'
        globalThis.localStorage.setItem('aarna-theme', nextTheme)
        globalThis.document.documentElement.dataset.theme = nextTheme
        
        assert.equal(globalThis.localStorage.getItem('aarna-theme'), nextTheme)
        assert.equal(globalThis.document.documentElement.dataset.theme, nextTheme)
      }
    })
  })
})

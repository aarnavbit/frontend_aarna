import fs from 'node:fs'
import path from 'node:path'

export function loadCssStylesheets(baseDir = process.cwd()) {
  const indexCssPath = path.resolve(baseDir, 'src/index.css')
  const audienceCssPath = path.resolve(baseDir, 'src/pages/AudienceDisplayPage.css')

  const indexCss = fs.existsSync(indexCssPath) ? fs.readFileSync(indexCssPath, 'utf8') : ''
  const audienceCss = fs.existsSync(audienceCssPath) ? fs.readFileSync(audienceCssPath, 'utf8') : ''

  return {
    indexCss,
    audienceCss,
    allCss: `${indexCss}\n${audienceCss}`,

    hasSelector(selector) {
      const regex = new RegExp(`(^|\\}|,|\\s)${escapeRegExp(selector)}\\s*\\{`, 'm')
      return regex.test(this.allCss)
    },

    hasToken(tokenName) {
      return this.indexCss.includes(tokenName)
    },

    hasDarkToken(tokenName) {
      const darkBlock = this.indexCss.match(/:root\[data-theme=['"]?dark['"]?\]\s*\{([^}]+)\}/s)
      return darkBlock ? darkBlock[1].includes(tokenName) : false
    },

    hasMediaQuery(maxWidthPx) {
      const regex = new RegExp(`@media\\s*\\([^)]*max-width:\\s*${maxWidthPx}px[^)]*\\)`)
      return regex.test(this.allCss)
    },

    hasReducedMotionSupport() {
      return this.allCss.includes('@media (prefers-reduced-motion: reduce)')
    },

    getDeclarationsFor(selector) {
      const cleanSelector = escapeRegExp(selector)
      const regex = new RegExp(`(?:^|\\}|,|\\s)${cleanSelector}\\s*\\{([^}]+)\\}`, 'gm')
      const matches = []
      let match
      while ((match = regex.exec(this.allCss)) !== null) {
        matches.push(match[1].trim())
      }
      return matches
    },

    hasOverflowClipOnShell() {
      const decls = this.getDeclarationsFor('.site-shell')
      return decls.some(d => d.includes('overflow-x: clip') || d.includes('overflow-x: hidden') || d.includes('overflow: hidden'))
    },

    inspectTouchTarget(selector) {
      const decls = this.getDeclarationsFor(selector)
      if (decls.length === 0) return { exists: false, meetsStandard: false }

      // Check min-width, min-height, width, height, or touch padding >= 44px
      const combined = decls.join(';\n')
      const has44pxMinSize = /min-width:\s*(?:44px|48px|3rem|2\.75rem)/.test(combined) ||
                             /min-height:\s*(?:44px|48px|3rem|2\.75rem)/.test(combined) ||
                             /width:\s*(?:44px|48px)/.test(combined) ||
                             /height:\s*(?:44px|48px)/.test(combined) ||
                             /padding:\s*(?:12px|14px|16px|1rem)/.test(combined)
      return {
        exists: true,
        meetsStandard: has44pxMinSize,
        declarations: combined
      }
    }
  }
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

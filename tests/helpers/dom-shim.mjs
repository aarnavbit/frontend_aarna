/**
 * Test Environment DOM & Browser Environment Shim for Node.js E2E Testing.
 */

export class MockStorage {
  constructor() {
    this.store = new Map()
  }
  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null
  }
  setItem(key, value) {
    this.store.set(String(key), String(value))
  }
  removeItem(key) {
    this.store.delete(key)
  }
  clear() {
    this.store.clear()
  }
  get length() {
    return this.store.size
  }
  key(index) {
    return Array.from(this.store.keys())[index] || null
  }
}

export function setupDomEnvironment(options = {}) {
  const {
    url = 'http://localhost:5173/',
    viewportWidth = 1024,
    viewportHeight = 768,
    prefersDark = false,
  } = options

  const parsedUrl = new URL(url)
  const localStorageMock = new MockStorage()
  const sessionStorageMock = new MockStorage()

  const listeners = new Map()

  const documentElement = {
    dataset: {},
    style: {},
    classList: {
      _classes: new Set(),
      add(c) { this._classes.add(c) },
      remove(c) { this._classes.delete(c) },
      contains(c) { return this._classes.has(c) }
    }
  }

  const body = {
    style: {},
    classList: {
      _classes: new Set(),
      add(c) { this._classes.add(c) },
      remove(c) { this._classes.delete(c) },
      contains(c) { return this._classes.has(c) }
    },
    appendChild(node) { return node },
    removeChild(node) { return node }
  }

  const domDocument = {
    documentElement,
    body,
    fullscreenElement: null,
    createElement(tag) {
      return {
        tagName: tag.toUpperCase(),
        style: {},
        attributes: {},
        href: '',
        download: '',
        click: () => {},
        remove: () => {},
        setAttribute(k, v) { this.attributes[k] = v },
        getAttribute(k) { return this.attributes[k] || null }
      }
    },
    getElementById(id) {
      return {
        id,
        scrollIntoView: () => {}
      }
    },
    addEventListener(event, handler) {
      if (!listeners.has(event)) listeners.set(event, new Set())
      listeners.get(event).add(handler)
    },
    removeEventListener(event, handler) {
      if (listeners.has(event)) {
        listeners.get(event).delete(handler)
      }
    },
    dispatchEvent(event) {
      const handlers = listeners.get(event.type)
      if (handlers) {
        handlers.forEach(fn => fn(event))
      }
      return true
    }
  }

  const windowMock = {
    location: {
      origin: parsedUrl.origin,
      host: parsedUrl.host,
      hostname: parsedUrl.hostname,
      pathname: parsedUrl.pathname,
      search: parsedUrl.search,
      hash: parsedUrl.hash,
      href: parsedUrl.href,
    },
    innerWidth: viewportWidth,
    innerHeight: viewportHeight,
    localStorage: localStorageMock,
    sessionStorage: sessionStorageMock,
    document: domDocument,
    scrollTo: () => {},
    matchMedia: (query) => {
      let matches = false
      if (query.includes('max-width')) {
        const match = query.match(/max-width:\s*(\d+)px/)
        if (match) {
          const maxW = parseInt(match[1], 10)
          matches = windowMock.innerWidth <= maxW
        }
      } else if (query.includes('min-width')) {
        const match = query.match(/min-width:\s*(\d+)px/)
        if (match) {
          const minW = parseInt(match[1], 10)
          matches = windowMock.innerWidth >= minW
        }
      } else if (query.includes('prefers-color-scheme: dark')) {
        matches = prefersDark
      }
      return {
        matches,
        media: query,
        addEventListener: (evt, cb) => {},
        removeEventListener: (evt, cb) => {},
        addListener: (cb) => {},
        removeListener: (cb) => {}
      }
    },
    addEventListener(event, handler) {
      if (!listeners.has(event)) listeners.set(event, new Set())
      listeners.get(event).add(handler)
    },
    removeEventListener(event, handler) {
      if (listeners.has(event)) {
        listeners.get(event).delete(handler)
      }
    },
    dispatchEvent(event) {
      const handlers = listeners.get(event.type)
      if (handlers) {
        handlers.forEach(fn => fn(event))
      }
      return true
    },
    URL: {
      createObjectURL: (blob) => `blob:http://localhost:5173/${Math.random().toString(36).slice(2)}`,
      revokeObjectURL: () => {}
    }
  }

  globalThis.window = windowMock
  globalThis.document = domDocument
  globalThis.localStorage = localStorageMock
  globalThis.sessionStorage = sessionStorageMock
  globalThis.location = windowMock.location

  return {
    window: windowMock,
    document: domDocument,
    localStorage: localStorageMock,
    sessionStorage: sessionStorageMock,
    setViewportWidth: (w) => {
      windowMock.innerWidth = w
    },
    dispatchKeyDown: (key) => {
      const event = { type: 'keydown', key, preventDefault: () => {} }
      domDocument.dispatchEvent(event)
      windowMock.dispatchEvent(event)
    },
    reset: () => {
      localStorageMock.clear()
      sessionStorageMock.clear()
      listeners.clear()
      documentElement.dataset = {}
      body.style = {}
    }
  }
}

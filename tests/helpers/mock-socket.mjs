export class MockSocket {
  constructor(url, options = {}) {
    this.url = url
    this.options = options
    this.handlers = new Map()
    this.connected = false
    this.emittedEvents = []
  }

  on(event, handler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set())
    }
    this.handlers.get(event).add(handler)
    return this
  }

  off(event, handler) {
    if (this.handlers.has(event)) {
      if (handler) {
        this.handlers.get(event).delete(handler)
      } else {
        this.handlers.delete(event)
      }
    }
    return this
  }

  emit(event, data) {
    this.emittedEvents.push({ event, data, timestamp: Date.now() })
    return this
  }

  // Server mock triggers
  triggerServerEvent(event, data) {
    if (this.handlers.has(event)) {
      this.handlers.get(event).forEach((fn) => {
        try {
          fn(data)
        } catch (err) {
          console.error(`Error in socket event handler for "${event}":`, err)
        }
      })
    }
  }

  simulateConnect() {
    this.connected = true
    this.triggerServerEvent('connect')
  }

  simulateDisconnect(reason = 'transport close') {
    this.connected = false
    this.triggerServerEvent('disconnect', reason)
  }

  disconnect() {
    this.simulateDisconnect('client disconnect')
  }

  close() {
    this.disconnect()
  }
}

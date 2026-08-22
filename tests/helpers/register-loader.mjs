import { register } from 'node:module'
import { setupDomEnvironment } from './dom-shim.mjs'

setupDomEnvironment()

globalThis.__VITE_ENV__ = {
  VITE_API_BASE_URL: 'http://localhost:8000',
  VITE_ADMIN_API_BASE_URL: 'http://localhost:8000/admin',
  MODE: 'test',
  DEV: true,
  PROD: false
}

register('./loader.mjs', import.meta.url)

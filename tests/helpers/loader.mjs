import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { transformWithOxc } from 'vite'

export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'debug') {
    return {
      format: 'module',
      shortCircuit: true,
      url: 'data:text/javascript,const debug = () => () => {}; export default debug; export { debug };'
    }
  }

  if (specifier.startsWith('.') && context.parentURL && context.parentURL.startsWith('file:')) {
    const parentDir = path.dirname(fileURLToPath(context.parentURL))
    const candidatePath = path.resolve(parentDir, specifier)
    
    if (fs.existsSync(candidatePath) && fs.statSync(candidatePath).isFile()) {
      return nextResolve(specifier, context)
    }

    for (const ext of ['.js', '.jsx', '.json', '/index.js', '/index.jsx']) {
      const p = candidatePath + ext
      if (fs.existsSync(p) && fs.statSync(p).isFile()) {
        return {
          format: 'module',
          shortCircuit: true,
          url: pathToFileURL(p).href
        }
      }
    }
  }

  return nextResolve(specifier, context)
}

export async function load(url, context, nextLoad) {
  // CSS files stubbing
  if (url.endsWith('.css') || url.includes('.css?')) {
    return {
      format: 'module',
      shortCircuit: true,
      source: 'export default {};'
    }
  }

  // Asset files stubbing
  if (/\.(png|jpg|jpeg|svg|webp|gif|ico|mp4|webm|woff2?|ttf|eot)$/i.test(url)) {
    return {
      format: 'module',
      shortCircuit: true,
      source: `export default ${JSON.stringify(url)};`
    }
  }

  // Source files (.jsx, .js in src)
  if (url.startsWith('file:') && (url.includes('/src/') || url.includes('\\src\\'))) {
    const filePath = fileURLToPath(url)
    if (fs.existsSync(filePath)) {
      let raw = fs.readFileSync(filePath, 'utf8')
      let source = raw.replaceAll('import.meta.env', '(globalThis.__VITE_ENV__ || {})')
      
      const isJsx = filePath.endsWith('.jsx') || raw.includes('</') || raw.includes('/>')
      if (isJsx) {
        const transformed = await transformWithOxc(source, filePath, {
          jsx: { runtime: 'automatic' }
        })
        source = transformed.code
      }

      return {
        format: 'module',
        shortCircuit: true,
        source
      }
    }
  }

  return nextLoad(url, context)
}

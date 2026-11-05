import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'

// Commit hash baked into the build and sent as X-App-Version on every request.
const appVersion = (() => {
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    return (process.env.GITHUB_SHA ?? 'dev').slice(0, 7)
  }
})()

// GitHub Pages serves this site at the root of its custom domain
// (inspeccion.gaspex360.com/), not under /inspector-gas-mockup/ — that
// subpath base only applied when the site lived at the default
// committed-cl.github.io/inspector-gas-mockup/ URL with no custom domain.
export default defineConfig({
  plugins: [react()],
  define: { __APP_VERSION__: JSON.stringify(appVersion) },
  base: '/',
})

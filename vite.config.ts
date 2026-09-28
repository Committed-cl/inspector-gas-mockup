import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serves this site at the root of its custom domain
// (inspeccion.gaspex360.com/), not under /inspector-gas-mockup/ — that
// subpath base only applied when the site lived at the default
// committed-cl.github.io/inspector-gas-mockup/ URL with no custom domain.
export default defineConfig({
  plugins: [react()],
  base: '/',
})

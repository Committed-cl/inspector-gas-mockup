import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The /inspector-gas-mockup/ base is only needed for the GitHub Pages
// production build (served from that subpath) — applying it to `vite dev`
// too meant localhost:5173/checklist 404'd unless you knew to prepend the
// subpath, which nobody would guess when just testing locally.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/inspector-gas-mockup/' : '/',
}))

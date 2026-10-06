import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

import viteReact from '@vitejs/plugin-react'

// Standalone on purpose: vite.config.ts carries tanstackStart(), whose env
// resolve config splits React into two instances under vitest.
const config = defineConfig({
  plugins: [tsconfigPaths({ projects: ['./tsconfig.json'] }), viteReact()],
  test: {
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
  },
})

export default config

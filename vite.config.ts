import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/math-planet/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/tests/setup.ts',
    css: true,
    testTimeout: 60000,
    // Keep file isolation while reusing one worker under memory pressure.
    pool: 'vmThreads',
    maxWorkers: 1,
  },
})

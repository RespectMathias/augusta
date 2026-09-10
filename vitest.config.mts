import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths({ skip: (dir) => dir === '.context' }), react()],
  test: { environment: 'jsdom', include: ['tests/**/*.test.{ts,tsx}'] },
})

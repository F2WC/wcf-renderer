import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '~': fileURLToPath(new URL('../', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      external: ['@mf/vue', '@mf/react'],
    },
  }
})

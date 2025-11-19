import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    lib: {
      formats: ['es'],
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      fileName: 'index',
    },
  },
})

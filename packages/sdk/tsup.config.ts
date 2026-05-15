import { defineConfig } from 'tsup'

export default defineConfig({
  tsconfig: 'tsconfig.json',
  entry: ['src/index.ts'],
  sourcemap: true,
  clean: false,
  dts: true,
  format: ['esm', 'cjs'],
  // Intentionally unminified: the SDK contains a runtime-only dynamic import
  minify: false,
  treeshake: true,
})

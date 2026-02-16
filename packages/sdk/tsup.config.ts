import { defineConfig } from 'tsup'

export default defineConfig({
  tsconfig: 'tsconfig.json',
  entry: ['src/index.ts'],
  sourcemap: true,
  clean: false,
  dts: true,
  format: ['esm', 'cjs'],
  minify: true,
  treeshake: true,
})

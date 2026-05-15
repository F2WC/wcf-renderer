import { defineConfig } from 'tsup'

export default defineConfig({
  tsconfig: 'tsconfig.json',
  entry: ['src/index.ts'],
  sourcemap: true,
  clean: false,
  dts: true,
  format: ['esm', 'cjs'],
  // Bundle Lit so consumers don't need to install it separately.
  noExternal: ['lit', '@lit/reactive-element', 'lit-element', 'lit-html'],
  minify: false,
  treeshake: true,
})

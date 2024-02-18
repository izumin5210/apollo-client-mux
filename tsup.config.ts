import { defineConfig } from "tsup";

export default defineConfig({
  entry: ['src'],
  format: ['cjs', 'esm'],
  splitting: true,
  sourcemap: true,
  dts: true,
  clean: true,
});

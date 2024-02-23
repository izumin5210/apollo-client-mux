import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/transform.ts"],
  format: ["cjs", "esm"],
  sourcemap: true,
  clean: true,
  onSuccess: "pnpm tsc --project tsconfig.build.json",
});

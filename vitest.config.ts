import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      // https://github.com/graphql/graphql-js/issues/2801#issuecomment-1846206543
      graphql: "graphql/index.js",
    },
  },
});

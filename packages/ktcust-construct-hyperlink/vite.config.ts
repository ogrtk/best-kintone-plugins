import { defineConfig } from "vite";
import baseConfig from "../../vite.config";

// Viteの設定
export default defineConfig({
  ...baseConfig,

  server: {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
    },
    https: baseConfig?.server?.https,
  },
});

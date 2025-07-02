import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import baseConfig from "../../vite.config";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * kintoneカスタマイズ用　ビルド設定
 */
export default defineConfig({
  plugins: [tsconfigPaths()],
  build: {
    chunkSizeWarningLimit: 1000, // KB 単位
    sourcemap: true,
    emptyOutDir: true,
    // plugin/js/customizeディレクトリ配下に出力
    outDir: path.resolve(__dirname, "plugin", "js", "customize"),
    rollupOptions: {
      treeshake: true,
      input: {
        desktop: path.resolve(__dirname, "src", "customize", "customize.tsx"),
      },
      output: {
        // 即時実行関数
        format: "iife",
        entryFileNames: "[name].js",
      },
    },
  },
  publicDir: false, // public は使わない
  server: {
    port: 5173,
    https: baseConfig.server?.https,
    open: "https://localhost:5173/desktop.js",
  },
});

import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * kintoneプラグイン設定画面用　ビルド設定
 */
export default defineConfig({
  plugins: [tsconfigPaths()],
  build: {
    chunkSizeWarningLimit: 1000, // KB 単位
    sourcemap: true,
    emptyOutDir: true,
    // plugin/js/configディレクトリ配下に出力
    outDir: path.resolve(__dirname, "plugin", "js", "config"),
    rollupOptions: {
      input: { config: path.resolve(__dirname, "src", "config", "config.tsx") },
      external: [
        path.resolve(__dirname, "src/customize/customize.tsx"),
        "src/customize/customize.tsx",
      ],
      output: {
        entryFileNames: "[name].js",
        format: "iife", // 即時実行関数
      },
      onwarn(warning, warn) {
        if (
          warning.message.includes('"use client"') ||
          warning.code === "MODULE_LEVEL_DIRECTIVE"
        ) {
          return; // 無視する
        }
        if (
          warning.message.includes(
            "Can't resolve original location of error",
          ) ||
          warning.code === "SOURCEMAP_ERROR"
        ) {
          return;
        }
        warn(warning); // その他の警告は表示
      },
    },
  },
});

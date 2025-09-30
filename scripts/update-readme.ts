#!/usr/bin/env tsx

import { promises as fs } from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface PackageInfo {
  name: string;
  version: string;
  description: string;
  targetSystem: string;
  directory: string;
  hasArtifact: boolean;
  isPublished: boolean;
}

interface ReleaseConfig {
  artifact: boolean;
  publish: boolean;
}

const SYSTEM_MAPPING: Record<string, string> = {
  ktplug: "kintone",
  ktcust: "kintone",
  fbcust: "FormBridge",
  kvcust: "kViewer",
  shared: "Internal",
};

async function readJsonFile<T>(filePath: string): Promise<T> {
  const content = await fs.readFile(filePath, "utf-8");
  return JSON.parse(content);
}

async function getPackageInfo(packageDir: string): Promise<PackageInfo | null> {
  try {
    const packageJsonPath = path.join(packageDir, "package.json");
    const releaseConfigPath = path.join(packageDir, ".releaseconfig.json");

    // package.json を読み込み
    const packageJson = await readJsonFile<{
      name: string;
      version: string;
      description: string;
    }>(packageJsonPath);

    // .releaseconfig.json を読み込み
    const releaseConfig = await readJsonFile<ReleaseConfig>(releaseConfigPath);

    // パッケージ名からプレフィックスを抽出
    const packageName = path.basename(packageDir);
    const prefix = packageName.split("-")[0];
    const targetSystem = SYSTEM_MAPPING[prefix] || "Unknown";

    return {
      name: packageName,
      version: packageJson.version,
      description: packageJson.description || "",
      targetSystem,
      directory: packageDir,
      hasArtifact: releaseConfig.artifact,
      isPublished: releaseConfig.publish,
    };
  } catch (error) {
    console.warn(`Could not read package info for ${packageDir}:`, error);
    return null;
  }
}

async function getLatestReleaseUrl(
  packageName: string,
  version: string,
): Promise<string | null> {
  try {
    // GitHub APIを使って最新リリースを取得する場合はここで実装
    // 現在は既存のパターンに従ってURLを生成
    const encodedName = encodeURIComponent(`@ogrtk/${packageName}@${version}`);
    return `https://github.com/ogrtk/best-kintone-plugins/releases/tag/${encodedName}`;
  } catch (error) {
    console.warn(`Could not get release URL for ${packageName}:`, error);
    return null;
  }
}

async function generatePackageTable(packages: PackageInfo[]): Promise<string> {
  const tableHeader = `| project | 対象 | 説明 | artifact |
| ------------------------------------------------------------------------- | ----------- | ------------------------ |----|`;

  const tableRows = await Promise.all(
    packages.map(async (pkg) => {
      // sharedパッケージは内部用なので除外
      if (pkg.name === "shared") {
        return null;
      }

      const projectLink = `[**${pkg.name}**](https://github.com/ogrtk/best-kintone-plugins/tree/main/packages/${pkg.name})`;

      let artifactCell = "";
      if (pkg.hasArtifact) {
        const releaseUrl = await getLatestReleaseUrl(pkg.name, pkg.version);
        if (releaseUrl) {
          artifactCell = `[${pkg.version}](${releaseUrl})`;
        }
      }

      return `| ${projectLink} | ${pkg.targetSystem} | ${pkg.description} | ${artifactCell}`;
    }),
  );

  const validRows = tableRows.filter((row) => row !== null);

  return [tableHeader, ...validRows].join("\n");
}

async function updateReadme(): Promise<void> {
  const rootDir = path.resolve(__dirname, "..");
  const packagesDir = path.join(rootDir, "packages");
  const readmePath = path.join(rootDir, "readme.md");

  try {
    // packages ディレクトリ内のすべてのサブディレクトリを取得
    const entries = await fs.readdir(packagesDir, { withFileTypes: true });
    const packageDirs = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join(packagesDir, entry.name));

    // 各パッケージの情報を取得
    const packageInfos = await Promise.all(
      packageDirs.map((dir) => getPackageInfo(dir)),
    );

    const validPackages = packageInfos.filter(
      (info): info is PackageInfo => info !== null,
    );

    console.log(`Found ${validPackages.length} packages:`);
    for (const pkg of validPackages) {
      console.log(`  - ${pkg.name} (${pkg.version}) - ${pkg.description}`);
    }

    // 現在のREADMEを読み込み
    const currentReadme = await fs.readFile(readmePath, "utf-8");

    // パッケージテーブルを生成
    const packageTable = await generatePackageTable(validPackages);

    // READMEの該当部分を置換
    const tableStartMarker = "| project | 対象 | 説明 | artifact |";
    const tableEndMarker = "各プロジェクトの詳細については";

    const startIndex = currentReadme.indexOf(tableStartMarker);
    const endIndex = currentReadme.indexOf(tableEndMarker);

    if (startIndex === -1 || endIndex === -1) {
      console.error("❌ Table markers not found:");
      console.error(`Start marker found: ${startIndex !== -1}`);
      console.error(`End marker found: ${endIndex !== -1}`);
      console.error("README content snippet:");
      console.error(currentReadme.substring(0, 500));
      throw new Error(
        `Could not find table markers in README. Start: ${startIndex}, End: ${endIndex}`,
      );
    }

    const beforeTable = currentReadme.substring(0, startIndex);
    const afterTable = currentReadme.substring(endIndex);

    const newReadme = `${beforeTable + packageTable}\n\n${afterTable}`;

    // READMEを更新
    await fs.writeFile(readmePath, newReadme, "utf-8");

    console.log("✅ README.md has been updated successfully!");
    console.log(`📦 Updated information for ${validPackages.length} packages`);
  } catch (error) {
    console.error("❌ Error updating README:", error);
    process.exit(1);
  }
}

// スクリプトが直接実行された場合
if (import.meta.url === `file://${process.argv[1]}`) {
  updateReadme().catch(console.error);
}

export { updateReadme };

#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const packagesDir = path.join(process.cwd(), "packages");
const outputFile = path.join(process.cwd(), "ppk_store.json");

const result = {};

const pkgDirs = fs.readdirSync(packagesDir);
for (const pkgDir of pkgDirs) {
  const packageJsonPath = path.join(packagesDir, pkgDir, "package.json");
  const ppkPath = path.join(packagesDir, pkgDir, "dist", "private.ppk");

  if (!fs.existsSync(packageJsonPath)) continue;
  if (!fs.existsSync(ppkPath)) continue;

  const pkgJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  const packageName = pkgJson.name;

  const ppkBuffer = fs.readFileSync(ppkPath);
  const ppkBase64 = ppkBuffer.toString("base64");

  result[packageName] = ppkBase64;

  console.log(`✅ Found ppk for ${packageName}`);
}

fs.writeFileSync(outputFile, JSON.stringify(result, null, 2), "utf8");
console.log(`\n🎯 Generated ${outputFile}`);

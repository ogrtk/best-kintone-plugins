import fs from "node:fs";
import path from "node:path";

const packagesDir = path.resolve("packages");
const outputFile = path.resolve("ppk_store.json");

const result: Record<string, string> = {};

const packageDirs = fs
  .readdirSync(packagesDir, { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => dirent.name);

for (const dir of packageDirs) {
  const pkgPath = path.join(packagesDir, dir);
  const pkgJsonPath = path.join(pkgPath, "package.json");
  const ppkPath = path.join(pkgPath, "scripts", "private.ppk");

  if (!fs.existsSync(pkgJsonPath) || !fs.existsSync(ppkPath)) continue;

  try {
    const { name } = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));
    if (typeof name !== "string") {
      console.warn(`⚠️ Skipping ${dir}: missing or invalid 'name'`);
      continue;
    }

    const ppkBase64 = fs.readFileSync(ppkPath).toString("base64");
    result[name] = ppkBase64;
    console.log(`✅ Found ppk for ${name}`);
  } catch (err) {
    console.warn(`⚠️ Failed to process ${dir}:`, err);
  }
}

fs.writeFileSync(outputFile, JSON.stringify(result, null, 2), "utf8");
console.log(`\n🎯 Generated ${outputFile}`);

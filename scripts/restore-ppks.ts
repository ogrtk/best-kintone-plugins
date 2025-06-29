import fs from "node:fs";
import path from "node:path";

const inputFile = path.resolve("ppk_store.json");
const packagesDir = path.resolve("packages");

if (!fs.existsSync(inputFile)) {
  console.error("❌ ppk_store.json not found");
  process.exit(1);
}

const store: Record<string, string> = JSON.parse(
  fs.readFileSync(inputFile, "utf8"),
);

for (const [pkgName, ppkBase64] of Object.entries(store)) {
  const candidates = fs.readdirSync(packagesDir);

  const matchDir = candidates.find((dir) => {
    const fullPath = path.join(packagesDir, dir, "package.json");
    if (!fs.existsSync(fullPath)) return false;
    try {
      const json = JSON.parse(fs.readFileSync(fullPath, "utf8"));
      return json.name === pkgName;
    } catch {
      return false;
    }
  });

  if (!matchDir) {
    console.warn(`⚠️ Could not locate package for ${pkgName}`);
    continue;
  }

  const secretsDir = path.join(packagesDir, matchDir, "secrets");
  const ppkPath = path.join(secretsDir, "private.ppk");

  fs.mkdirSync(secretsDir, { recursive: true });
  fs.writeFileSync(ppkPath, Buffer.from(ppkBase64, "base64"));
  console.log(`✅ Restored private.ppk for ${pkgName}`);
}

console.log("\n🎯 All applicable private.ppk files have been restored.");

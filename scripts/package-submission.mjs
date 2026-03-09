import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "dist", "submission-bundle");
const submissionDir = path.join(root, "submission");
const requiredFiles = [
  "submission/app-metadata.json",
  "submission/openai-submission-payload.json",
  "submission/test-prompts.md",
  "submission/checklist.md",
  "submission/review-notes.md"
];

for (const file of requiredFiles) {
  try {
    await fs.access(path.join(root, file));
  } catch {
    console.error("Missing required submission file:", file);
    process.exit(1);
  }
}

await fs.rm(outDir, { recursive: true, force: true });
await fs.mkdir(outDir, { recursive: true });

for (const rel of requiredFiles) {
  const src = path.join(root, rel);
  const dst = path.join(outDir, rel.replace("submission/", ""));
  await fs.copyFile(src, dst);
}

const packageManifest = {
  generatedAt: new Date().toISOString(),
  mcpUrl: process.env.PRODUCTION_MCP_URL || "REPLACE_ME",
  appBaseUrl: process.env.APP_BASE_URL || "REPLACE_ME",
  includedFiles: requiredFiles.map((f) => f.replace("submission/", ""))
};

await fs.writeFile(path.join(outDir, "bundle-manifest.json"), JSON.stringify(packageManifest, null, 2), "utf8");
console.log("Submission bundle created at:", outDir);

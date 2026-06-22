import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { defaultState } from "../lib/seed.js";

async function main() {
  const dataDir = join(process.cwd(), "data");
  const statePath = join(dataDir, "next-state.json");
  
  await mkdir(dataDir, { recursive: true });
  await writeFile(
    statePath, 
    JSON.stringify({ ...defaultState, serverSavedAt: new Date().toISOString() }, null, 2)
  );
  
  console.log("JSON state file next-state.json reset to defaults successfully.");
}

main().catch(console.error);

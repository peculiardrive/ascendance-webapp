import { readFile } from "node:fs/promises";
import { join } from "node:path";

async function run() {
  const path = join(process.cwd(), "scratch", "rhapsodies-raw.txt");
  const raw = await readFile(path, "utf8");
  const lines = raw.split(/\r?\n/);
  
  let printedCount = 0;
  console.log("--- First 50 non-empty lines ---");
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed) {
      console.log(`Line ${i + 1}: "${trimmed}"`);
      printedCount++;
      if (printedCount >= 50) break;
    }
  }
}

run().catch(console.error);

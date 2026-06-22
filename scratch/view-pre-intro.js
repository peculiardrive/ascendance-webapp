import { readFile } from "node:fs/promises";
import { join } from "node:path";

async function run() {
  const path = join(process.cwd(), "scratch", "rhapsodies-raw.txt");
  const raw = await readFile(path, "utf8");
  const lines = raw.split(/\r?\n/);
  
  console.log("--- Lines 1 to 111 ---");
  for (let i = 0; i < 111; i++) {
    const trimmed = lines[i].trim();
    if (trimmed) {
      console.log(`Line ${i + 1}: "${trimmed}"`);
    }
  }
}

run().catch(console.error);

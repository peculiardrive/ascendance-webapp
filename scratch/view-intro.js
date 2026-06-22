import { readFile } from "node:fs/promises";
import { join } from "node:path";

async function run() {
  const path = join(process.cwd(), "scratch", "rhapsodies-raw.txt");
  const raw = await readFile(path, "utf8");
  const lines = raw.split(/\r?\n/);
  
  console.log("--- Lines 111 to 157 ---");
  for (let i = 110; i < 157; i++) {
    const trimmed = lines[i].trim();
    if (trimmed) {
      console.log(`Line ${i + 1}: "${trimmed}"`);
    }
  }
}

run().catch(console.error);

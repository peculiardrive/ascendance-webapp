import { readFile } from "node:fs/promises";
import { join } from "node:path";

async function run() {
  const path = join(process.cwd(), "scratch", "rhapsodies-raw.txt");
  const raw = await readFile(path, "utf8");
  const lines = raw.split(/\r?\n/);
  
  console.log("--- Lines after 13907 ---");
  for (let i = 13906; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed) {
      console.log(`Line ${i + 1}: "${trimmed}"`);
    }
  }
}

run().catch(console.error);

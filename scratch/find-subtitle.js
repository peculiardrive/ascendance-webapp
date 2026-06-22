import { readFile } from "node:fs/promises";
import { join } from "node:path";

async function run() {
  const path = join(process.cwd(), "scratch", "rhapsodies-raw.txt");
  const raw = await readFile(path, "utf8");
  const lines = raw.split(/\r?\n/);
  
  // Let's print around the heading "ONE" and others to see if there are subtitles
  const headings = [157, 705, 1233]; // Line numbers from before (1-based)
  for (const h of headings) {
    console.log(`\n--- Heading at line ${h} ---`);
    for (let i = h - 5; i <= h + 10; i++) {
      if (i >= 0 && i < lines.length) {
        console.log(`${i + 1}: ${lines[i]}`);
      }
    }
  }
}

run().catch(console.error);

import { readFile } from "node:fs/promises";
import { join } from "node:path";

async function run() {
  const path = join(process.cwd(), "data", "next-state.json");
  const raw = await readFile(path, "utf8");
  const state = JSON.parse(raw);
  
  for (const book of state.books) {
    console.log(`\nBook: "${book.title}" (ID: ${book.id})`);
    for (const sec of book.sections) {
      console.log(`  Section: "${sec.title}" (ID: ${sec.id})`);
      const chaptersInfo = sec.chapters.map(c => `${c.title} (ID: ${c.id})`);
      console.log(`    Chapters (first 2):`, chaptersInfo.slice(0, 2));
      console.log(`    Chapters (last 2):`, chaptersInfo.slice(-2));
    }
  }
}

run().catch(console.error);

import { readFile } from "node:fs/promises";
import { join } from "node:path";

async function run() {
  const path = join(process.cwd(), "data", "next-state.json");
  const raw = await readFile(path, "utf8");
  const state = JSON.parse(raw);
  const book1 = state.books.find(b => b.id === "book-1");
  for (const sec of book1.sections) {
    console.log(`Section: ${sec.id} (${sec.title})`);
    for (const ch of sec.chapters) {
      console.log(`  Chapter: ${ch.id} (${ch.title}) - isPreview: ${ch.isPreview}`);
    }
  }
}
run();

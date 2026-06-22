import { readFile } from "node:fs/promises";
import { join } from "node:path";

async function run() {
  const path = join(process.cwd(), "data", "next-state.json");
  const raw = await readFile(path, "utf8");
  const state = JSON.parse(raw);
  
  const book1 = state.books.find(b => b.title.includes("Disciples"));
  if (book1) {
    console.log("Book 1 title:", book1.title);
    for (const sec of book1.sections) {
      console.log(`  Section: "${sec.title}"`);
      const previewChapters = sec.chapters.filter(c => c.isPreview);
      const lockedChapters = sec.chapters.filter(c => !c.isPreview);
      console.log(`    Preview chapters count: ${previewChapters.length}`);
      console.log(`    Locked chapters count: ${lockedChapters.length}`);
    }
  }
}

run().catch(console.error);

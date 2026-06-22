import { readFile } from "node:fs/promises";
import { join } from "node:path";

async function run() {
  const path = join(process.cwd(), "data", "next-state.json");
  const raw = await readFile(path, "utf8");
  const state = JSON.parse(raw);
  
  const book3 = state.books.find(b => b.id === "book-3");
  if (!book3) {
    console.log("Book 3 not found in next-state.json");
    return;
  }
  console.log("Book 3 title:", book3.title);
  console.log("Book 3 sections count:", book3.sections.length);
  for (const sec of book3.sections) {
    console.log(`  Section: "${sec.title}", chapters count: ${sec.chapters.length}`);
    if (sec.chapters.length > 0) {
      console.log(`    First Chapter: "${sec.chapters[0].title}"`);
      console.log(`    First Chapter Content paragraphs count: ${sec.chapters[0].content.length}`);
      console.log(`    First 2 paragraphs:`, sec.chapters[0].content.slice(0, 2));
    }
  }
}

run().catch(console.error);

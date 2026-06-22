import fs from "node:fs/promises";
import path from "node:path";

async function run() {
  const statePath = path.join(process.cwd(), "data", "next-state.json");
  const data = await fs.readFile(statePath, "utf8");
  const state = JSON.parse(data);

  console.log("Books found in next-state.json:", state.books.length);
  state.books.forEach((book, bIdx) => {
    console.log(`Book ${bIdx + 1}: ${book.title}`);
    console.log(`  Sections count: ${book.sections.length}`);
    book.sections.forEach((sec, sIdx) => {
      console.log(`    Section ${sIdx + 1}: "${sec.title}" has ${sec.chapters.length} chapters.`);
      if (sec.chapters.length > 0) {
        console.log(`      First Chapter: ${sec.chapters[0].title}`);
        console.log(`      Last Chapter: ${sec.chapters[sec.chapters.length - 1].title}`);
      }
    });
  });
}

run().catch(console.error);

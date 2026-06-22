import { readFile } from "node:fs/promises";
import { join } from "node:path";

async function run() {
  const path = join(process.cwd(), "data", "next-state.json");
  const raw = await readFile(path, "utf8");
  const state = JSON.parse(raw);
  console.log("State keys:", Object.keys(state));
  console.log("Number of books:", state.books.length);
  for (const book of state.books) {
    console.log(`- Book ID: ${book.id}, Title: "${book.title}", Sections: ${book.sections.length}`);
    for (const sec of book.sections) {
      console.log(`  - Section ID: ${sec.id}, Title: "${sec.title}", Chapters: ${sec.chapters.length}`);
      if (sec.chapters.length > 0) {
        console.log(`    - First Chapter: "${sec.chapters[0].title}" (${sec.chapters[0].subtitle}), ID: ${sec.chapters[0].id}`);
        console.log(`    - Last Chapter: "${sec.chapters[sec.chapters.length - 1].title}" (${sec.chapters[sec.chapters.length - 1].subtitle}), ID: ${sec.chapters[sec.chapters.length - 1].id}`);
      }
    }
  }
}

run().catch(console.error);

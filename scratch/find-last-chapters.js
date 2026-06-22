import { readFile } from "node:fs/promises";
import { join } from "node:path";

async function run() {
  const path = join(process.cwd(), "data", "next-state.json");
  const raw = await readFile(path, "utf8");
  const state = JSON.parse(raw);

  for (const book of state.books) {
    console.log(`\nBook: ${book.id} (${book.title})`);
    const allChapters = [];
    for (const sec of book.sections) {
      for (const ch of sec.chapters) {
        allChapters.push(ch);
      }
    }
    console.log(`Total Chapters: ${allChapters.length}`);
    if (allChapters.length > 0) {
      const first = allChapters[0];
      const last = allChapters[allChapters.length - 1];
      console.log(`First Chapter: ${first.id} (${first.title})`);
      console.log(`Last Chapter: ${last.id} (${last.title})`);
    }
  }
}
run().catch(console.error);

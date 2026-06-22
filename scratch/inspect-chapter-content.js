import { readFile } from "node:fs/promises";
import { join } from "node:path";

async function run() {
  const path = join(process.cwd(), "data", "next-state.json");
  const raw = await readFile(path, "utf8");
  const state = JSON.parse(raw);
  
  const book1 = state.books.find(b => b.title.includes("Disciples"));
  if (book1) {
    const sec1 = book1.sections[0];
    console.log("Section 1 Title:", sec1.title);
    if (sec1.chapters && sec1.chapters.length > 1) {
      console.log("Chapter 1 Title:", sec1.chapters[1].title);
      console.log("Chapter 1 Content (first 3 items):", sec1.chapters[1].content.slice(0, 3));
    }
  }
}

run().catch(console.error);

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
  
  console.log("Book 3 Section:");
  const sec = book3.sections[0];
  console.log(`- ID: ${sec.id}, Title: "${sec.title}"`);
  
  console.log("\nChapters:");
  sec.chapters.forEach((ch, idx) => {
    console.log(`Chapter ${idx}: ID: ${ch.id}, Title: "${ch.title}", SectionId (in JSON if any): ${ch.sectionId}`);
  });
}

run();

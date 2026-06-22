import { readFile } from "node:fs/promises";
import { join } from "node:path";

async function run() {
  const path = join(process.cwd(), "data", "state.json");
  const raw = await readFile(path, "utf8");
  const state = JSON.parse(raw);
  console.log("State keys in state.json:", Object.keys(state));
  console.log("Number of books in state.json:", state.books ? state.books.length : "undefined");
  if (state.books) {
    for (const book of state.books) {
      console.log(`- Book ID: ${book.id}, Title: "${book.title}", Sections: ${book.sections.length}`);
    }
  }
}

run().catch(console.error);

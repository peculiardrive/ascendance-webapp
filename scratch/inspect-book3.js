import { readFile } from "node:fs/promises";
import { join } from "node:path";

async function run() {
  const path = join(process.cwd(), "data", "state.json");
  const raw = await readFile(path, "utf8");
  const state = JSON.parse(raw);
  
  const book3 = state.books.find(b => b.id === "book-3");
  console.log("Book 3 from state.json:", JSON.stringify(book3, null, 2));
}

run().catch(console.error);

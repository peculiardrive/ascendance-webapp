import { GET as getBooks } from "../app/api/books/route.js";
import { GET as getChapter } from "../app/api/chapters/[chapterId]/route.js";

async function run() {
  console.log("Checking API route compilation...");
  console.log("getBooks is a function:", typeof getBooks === "function");
  console.log("getChapter is a function:", typeof getChapter === "function");
}

run().catch(console.error);

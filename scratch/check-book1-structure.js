import { readFile } from "node:fs/promises";
import { join } from "node:path";

async function run() {
  const path = join(process.cwd(), "data", "next-state.json");
  const raw = await readFile(path, "utf8");
  const state = JSON.parse(raw);
  
  const book1 = state.books.find(b => b.id === "book-1");
  if (!book1) {
    console.log("Book 1 not found!");
    return;
  }
  
  console.log("Book 1 Info:");
  console.log("ID:", book1.id);
  console.log("Title:", book1.title);
  console.log("Subtitle:", book1.subtitle);
  console.log("Author:", book1.author);
  console.log("Cover:", book1.cover);
  console.log("Price:", book1.price);
  console.log("USD Price:", book1.usdPrice);
  console.log("Status:", book1.status);
  console.log("Preview:", book1.preview);
  console.log("Blurb:", book1.blurb);
  
  console.log("\nSections count:", book1.sections.length);
  for (const sec of book1.sections) {
    console.log(`\n  Section: "${sec.title}"`);
    console.log("  - ID:", sec.id);
    console.log("  - Subtitle:", sec.subtitle);
    console.log("  - Order:", sec.order);
    console.log("  - Price:", sec.price);
    console.log("  - TTS:", sec.tts);
    console.log("  - Voice:", sec.voice);
    console.log("  - Chapters count:", sec.chapters.length);
    if (sec.chapters.length > 0) {
      console.log("    First Chapter Info:");
      const ch0 = sec.chapters[0];
      console.log("    - ID:", ch0.id);
      console.log("    - Title:", ch0.title);
      console.log("    - Subtitle:", ch0.subtitle);
      console.log("    - Order:", ch0.order);
      console.log("    - ChapterNumber:", ch0.chapterNumber);
      console.log("    - IsPreview:", ch0.isPreview);
      console.log("    - Status:", ch0.status);
      console.log("    - Content type/length:", typeof ch0.content, ch0.content?.length);
      
      console.log("    Last Chapter Info:");
      const chN = sec.chapters[sec.chapters.length - 1];
      console.log("    - ID:", chN.id);
      console.log("    - Title:", chN.title);
      console.log("    - Subtitle:", chN.subtitle);
      console.log("    - Order:", chN.order);
      console.log("    - ChapterNumber:", chN.chapterNumber);
      console.log("    - IsPreview:", chN.isPreview);
      console.log("    - Status:", chN.status);
      console.log("    - Content type/length:", typeof chN.content, chN.content?.length);
    }
  }
}

run().catch(console.error);

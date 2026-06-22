import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { seedBooks } from "../lib/seed.js";

async function migrateFile(filename) {
  const path = join(process.cwd(), "data", filename);
  try {
    const raw = await readFile(path, "utf8");
    const state = JSON.parse(raw);
    if (state && state.books) {
      let updated = 0;
      for (const book of state.books) {
        const seedBook = seedBooks.find(b => b.id === book.id);
        if (seedBook) {
          book.blurb = seedBook.blurb;
          book.summary = seedBook.summary;
          if (book.sections && seedBook.sections) {
            for (const section of book.sections) {
              const seedSection = seedBook.sections.find(s => s.id === section.id);
              if (seedSection) {
                section.voice = seedSection.voice;
              }
            }
          }
          updated++;
        }
      }
      await writeFile(path, JSON.stringify(state, null, 2));
      console.log(`✓ Updated ${updated} books in ${filename}`);
    }
  } catch (err) {
    console.log(`Could not migrate ${filename}: ${err.message}`);
  }
}

async function run() {
  await migrateFile("next-state.json");
  await migrateFile("state.json");
}

run();

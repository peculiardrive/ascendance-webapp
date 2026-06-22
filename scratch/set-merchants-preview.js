// Set the first 3 chapters of each section in "Merchants of the Ivory Towers" as isPreview: true
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const statePath = path.join(process.cwd(), 'data', 'next-state.json');
  const raw = await readFile(statePath, 'utf8');
  const state = JSON.parse(raw);

  const merchantsBook = state.books.find(b => b.title === 'Merchants of the Ivory Towers');
  if (!merchantsBook) {
    console.error('ERROR: Could not find "Merchants of the Ivory Towers" book in state.');
    process.exit(1);
  }

  let changed = 0;
  for (const section of merchantsBook.sections || []) {
    const chapters = section.chapters || [];
    // Mark first 3 chapters of each section as preview
    for (let i = 0; i < Math.min(3, chapters.length); i++) {
      if (!chapters[i].isPreview) {
        chapters[i].isPreview = true;
        console.log(`  Marked as preview: [${section.title}] ${chapters[i].title}`);
        changed++;
      }
    }
  }

  if (changed === 0) {
    console.log('No changes needed — preview chapters already set.');
    return;
  }

  await writeFile(statePath, JSON.stringify(state, null, 2));
  console.log(`\nDone! Marked ${changed} chapters as preview and saved next-state.json.`);
}

main().catch(err => { console.error(err); process.exit(1); });

import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import mammoth from "mammoth";

async function run() {
  const docxPath = join(process.cwd(), "Disciples of the Inverted Cross_rev.docx");
  const buffer = await readFile(docxPath);
  const result = await mammoth.extractRawText({ buffer });
  const rawText = result.value;
  
  await writeFile(join(process.cwd(), "scratch", "book1-rev-raw.txt"), rawText, "utf8");
  console.log("Raw text length:", rawText.length);
  
  const lines = rawText.split(/\r?\n/);
  console.log("Total lines:", lines.length);
  
  console.log("\n--- First 40 non-empty lines ---");
  let count = 0;
  for (let i = 0; i < lines.length && count < 40; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;
    count++;
    console.log(`${i + 1}: ${trimmed}`);
  }
  
  console.log("\n--- Potential Section/Chapter Headings ---");
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;
    if (trimmed.toUpperCase().startsWith("BOOK") || trimmed.toUpperCase().startsWith("CHAPTER") || trimmed.toUpperCase() === "PROLOGUE" || trimmed.toUpperCase().startsWith("PART") || trimmed.toUpperCase().startsWith("SECTION")) {
      console.log(`Line ${i + 1}: "${trimmed}"`);
    }
  }
}

run().catch(console.error);

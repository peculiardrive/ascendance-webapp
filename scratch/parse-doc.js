import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import mammoth from "mammoth";

async function run() {
  const docxPath = join(process.cwd(), "Rhapsodies of the Coming Regent.docx");
  const buffer = await readFile(docxPath);
  const result = await mammoth.extractRawText({ buffer });
  const rawText = result.value;
  
  await writeFile(join(process.cwd(), "scratch", "rhapsodies-raw.txt"), rawText, "utf8");
  console.log("Raw text length:", rawText.length);
  
  // Let's print the first 1000 characters and find all lines that might be headings
  const lines = rawText.split(/\r?\n/);
  console.log("Total lines:", lines.length);
  console.log("\n--- First 20 lines ---");
  for (let i = 0; i < Math.min(20, lines.length); i++) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
  
  console.log("\n--- Potential Section/Chapter Headings ---");
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;
    if (trimmed.toUpperCase().startsWith("BOOK") || trimmed.toUpperCase().startsWith("CHAPTER") || trimmed.toUpperCase() === "PROLOGUE" || trimmed.toUpperCase().startsWith("PART")) {
      console.log(`Line ${i + 1}: "${trimmed}"`);
    }
  }
}

run().catch(console.error);

import { readFile } from "node:fs/promises";
import { join } from "node:path";

async function run() {
  const path = join(process.cwd(), "scratch", "rhapsodies-raw.txt");
  const raw = await readFile(path, "utf8");
  const lines = raw.split(/\r?\n/);
  
  const headings = [];
  const NUMBER_WORDS = new Set([
    "PROLOGUE",
    "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE", "TEN",
    "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN", "SEVENTEEN", "EIGHTEEN", "NINETEEN", "TWENTY",
    "TWENTYONE", "TWENTYTWO", "TWENTYTHREE", "TWENTYFOUR", "TWENTYFIVE", "TWENTYSIX", "TWENTYSEVEN", "TWENTYEIGHT", "TWENTYNINE", "THIRTY",
    "THIRTYONE", "THIRTYTWO", "THIRTYTHREE", "THIRTYFOUR", "THIRTYFIVE", "THIRTYSIX", "THIRTYSEVEN", "THIRTYEIGHT", "THIRTYNINE", "FORTY",
    "FORTYONE", "FORTYTWO", "FORTYTHREE", "FORTYFOUR", "FORTYFIVE", "FORTYSIX", "FORTYSEVEN", "FORTYEIGHT", "FORTYNINE", "FIFTY"
  ]);

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;
    
    // Check if line starts with BOOK, PART, SECTION, etc.
    const isBook = /^(book\s+one|book\s+two|book\s+three|book\s+four|book\s+five|book\s+six|book\s+seven|book\s+eight|book\s+nine|book\s+ten|part|series|section)/i.test(trimmed);
    const normalized = trimmed.replace(/[\s-]/g, "").toUpperCase();
    const isChapterNum = NUMBER_WORDS.has(normalized);
    
    if (isBook || isChapterNum) {
      headings.push({ lineNum: i + 1, text: trimmed, type: isBook ? "BOOK" : "CHAPTER" });
    }
  }
  
  console.log(`Found ${headings.length} potential headings:`);
  for (const h of headings) {
    console.log(`Line ${h.lineNum} [${h.type}]: "${h.text}"`);
  }
}

run().catch(console.error);

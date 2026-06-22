import { readFile } from "node:fs/promises";
import { join } from "node:path";

async function run() {
  const path = join(process.cwd(), "scratch", "book1-rev-raw.txt");
  const raw = await readFile(path, "utf8");
  const lines = raw.split(/\r?\n/);
  
  const headings = [];
  const NUMBER_WORDS = new Set([
    "PROLOGUE",
    "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE", "TEN",
    "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN", "SEVENTEEN", "EIGHTEEN", "NINETEEN", "TWENTY",
    "TWENTY-ONE", "TWENTY-TWO", "TWENTY-THREE", "TWENTY-FOUR", "TWENTY-FIVE", "TWENTY-SIX", "TWENTY-SEVEN", "TWENTY-EIGHT", "TWENTY-NINE", "THIRTY",
    "THIRTY-ONE", "THIRTY-TWO", "THIRTY-THREE", "THIRTY-FOUR", "THIRTY-FIVE", "THIRTY-SIX", "THIRTY-SEVEN", "THIRTY-EIGHT", "THIRTY-NINE", "FORTY",
    "FORTY-ONE", "FORTYTWO", "FORTY-THREE", "FORTY-FOUR", "FORTY-FIVE", "FORTY-SIX", "FORTY-SEVEN", "FORTY-EIGHT", "FORTY-NINE", "FIFTY"
  ].map(w => w.replace(/[\s-]/g, "").toUpperCase()));

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;
    
    const isBook = /^(book\s+one|book\s+two|book\s+three|book\s+four|book\s+five|book\s+six|book\s+seven|book\s+eight|book\s+nine|book\s+ten|part|series|section)/i.test(trimmed);
    const normalized = trimmed.replace(/[\s-]/g, "").toUpperCase();
    const isChapterNum = NUMBER_WORDS.has(normalized);
    
    // Check if it's all uppercase and relatively short, or starts with CHAPTER/PROLOGUE
    const isAllCapsShort = trimmed.length < 50 && trimmed === trimmed.toUpperCase() && /^[A-Z0-9\s\-\:\.,\(\)\'\!\?]+$/.test(trimmed);
    
    if (isBook || isChapterNum || isAllCapsShort || trimmed.toUpperCase().startsWith("CHAPTER")) {
      headings.push({ lineNum: i + 1, text: trimmed });
    }
  }
  
  console.log(`Found ${headings.length} potential headings:`);
  for (const h of headings) {
    console.log(`Line ${h.lineNum}: "${h.text}"`);
  }
}

run().catch(console.error);

import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import mammoth from "mammoth";

const CHAPTER_WORDS = [
  "PROLOGUE",
  "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE", "TEN",
  "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN", "SEVENTEEN", "EIGHTEEN", "NINETEEN", "TWENTY",
  "TWENTY-ONE", "TWENTY-TWO", "TWENTY-THREE", "TWENTY-FOUR", "TWENTY- FIVE", "TWENTY-SIX", "TWENTY-SEVEN", "TWENTY- EIGHT", "TWENTY- NINE", "THIRTY",
  "THIRTY -ONE", "THIRTY-TWO", "THIRTY-THREE", "THIRTY-FOUR", "THIRTY-FIVE", "THIRTY-SIX", "THIRTY-SEVEN", "THIRTY-EIGHT", "THIRTY-NINE", "FORTY",
  "FORTY-ONE", "FORTY-TWO", "FORTY-THREE", "FORTY-FOUR"
];

function normalizeWord(w) {
  return w.replace(/[\s-]/g, "").toUpperCase();
}

// Map of normalized word -> chapter index
const normalizedMap = {};
CHAPTER_WORDS.forEach((word, idx) => {
  normalizedMap[normalizeWord(word)] = idx;
});

async function run() {
  const docxPath = join(process.cwd(), "Disciples of the Inverted Cross_rev.docx");
  console.log("Reading revised Book 1 docx file...");
  const buffer = await readFile(docxPath);
  const result = await mammoth.extractRawText({ buffer });
  const rawText = result.value;
  
  const lines = rawText.split(/\r?\n/);
  console.log(`Total raw lines: ${lines.length}`);

  // Initialize chapters array
  const chapters = Array.from({ length: 45 }, (_, i) => ({
    index: i,
    heading: CHAPTER_WORDS[i],
    content: []
  }));

  let currentChapterIdx = null;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;

    // Check if line is a metadata or section boundary to skip
    if (
      trimmed === "Disciples of the Inverted Cross" ||
      trimmed === "Stanley Ohanugo" ||
      trimmed === "Ikenna Obiajulu" ||
      trimmed === "BOOK ONE: THE FORMATION" ||
      trimmed === "BOOK TWO: THE FALL" ||
      trimmed === "BOOK THREE: THE FRATERNITY"
    ) {
      continue;
    }

    const normalizedLine = normalizeWord(trimmed);
    if (normalizedMap.hasOwnProperty(normalizedLine)) {
      currentChapterIdx = normalizedMap[normalizedLine];
      console.log(`Line ${i + 1}: Found chapter heading "${trimmed}" -> Chapter ${currentChapterIdx}`);
    } else {
      if (currentChapterIdx !== null) {
        chapters[currentChapterIdx].content.push(`<p>${trimmed}</p>`);
      }
    }
  }

  // Verification checks
  console.log("\n--- Verification of Parsed Chapters ---");
  let missingChapters = [];
  chapters.forEach((ch) => {
    console.log(`Chapter ${ch.index} (${ch.heading}): ${ch.content.length} paragraphs`);
    if (ch.content.length === 0) {
      missingChapters.push(ch.index);
    }
  });

  if (missingChapters.length > 0) {
    throw new Error(`Error: Chapters with 0 paragraphs: ${missingChapters.join(", ")}`);
  }

  console.log("\nSample Verification:");
  console.log(`Prologue First Paragraph: ${chapters[0].content[0]}`);
  console.log(`Prologue Last Paragraph: ${chapters[0].content[chapters[0].content.length - 1]}`);
  console.log(`Chapter 1 First Paragraph: ${chapters[1].content[0]}`);
  console.log(`Chapter 44 Last Paragraph: ${chapters[44].content[chapters[44].content.length - 1]}`);

  // Now update next-state.json and state.json
  const stateFiles = [
    join(process.cwd(), "data", "next-state.json"),
    join(process.cwd(), "data", "state.json")
  ];

  for (const filePath of stateFiles) {
    console.log(`\nUpdating ${filePath}...`);
    const rawState = await readFile(filePath, "utf8");
    const state = JSON.parse(rawState);

    const book1 = state.books.find((b) => b.id === "book-1");
    if (!book1) {
      throw new Error(`Could not find Book 1 in ${filePath}`);
    }

    let updatedCount = 0;
    book1.sections.forEach((section) => {
      section.chapters.forEach((chapter) => {
        // Extract the index from the chapter id (e.g. b1-c12 -> 12)
        const match = chapter.id.match(/^b1-c(\d+)$/);
        if (match) {
          const idx = parseInt(match[1], 10);
          if (idx >= 0 && idx < 45) {
            chapter.content = chapters[idx].content;
            updatedCount++;
          }
        }
      });
    });

    console.log(`Updated content for ${updatedCount} chapters in ${filePath}`);

    // Update serverSavedAt timestamp if it exists
    state.serverSavedAt = new Date().toISOString();

    await writeFile(filePath, JSON.stringify(state, null, 2), "utf8");
    console.log(`Successfully saved ${filePath}`);
  }

  console.log("\nParse and migration finished successfully!");
}

run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

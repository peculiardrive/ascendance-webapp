import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import mammoth from "mammoth";

const NUMBER_WORDS_MAP = {
  "ONE": 1, "TWO": 2, "THREE": 3, "FOUR": 4, "FIVE": 5, "SIX": 6, "SEVEN": 7, "EIGHT": 8, "NINE": 9, "TEN": 10,
  "ELEVEN": 11, "TWELVE": 12, "THIRTEEN": 13, "FOURTEEN": 14, "FIFTEEN": 15, "SIXTEEN": 16, "SEVENTEEN": 17, "EIGHTEEN": 18, "NINETEEN": 19, "TWENTY": 20,
  "TWENTYONE": 21, "TWENTYTWO": 22, "TWENTYTHREE": 23, "TWENTYFOUR": 24, "TWENTYFIVE": 25, "TWENTYSIX": 26, "TWENTYSEVEN": 27, "TWENTYEIGHT": 28, "TWENTYNINE": 29, "THIRTY": 30,
  "THIRTYONE": 31, "THIRTYTWO": 32, "THIRTYTHREE": 33, "THIRTYFOUR": 34, "THIRTYFIVE": 35, "THIRTYSIX": 36, "THIRTYSEVEN": 37, "THIRTYEIGHT": 38, "THIRTYNINE": 39
};

const getChapterNumber = (line) => {
  const normalized = line.replace(/[\s-]/g, "").toUpperCase();
  if (NUMBER_WORDS_MAP[normalized] !== undefined) {
    return NUMBER_WORDS_MAP[normalized];
  }
  return null;
};

async function parseBook3() {
  const docxPath = join(process.cwd(), "Rhapsodies of the Coming Regent.docx");
  const buffer = await readFile(docxPath);
  const result = await mammoth.extractRawText({ buffer });
  const rawText = result.value;
  const lines = rawText.split(/\r?\n/);

  const sections = [
    {
      id: "b3-s1",
      title: "BOOK SIX: THE FULFILLMENT",
      subtitle: "by Lizzy",
      order: 1,
      price: 2500,
      tts: true,
      voice: "Male",
      chapters: []
    }
  ];

  let currentChapter = null;

  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Skip the title and subtitle headers at the beginning
    if (trimmed === "Rhapsodies of the Coming Regent" || trimmed === "BOOK SIX: THE FULFILLMENT" || trimmed === "Lizzy") {
      continue;
    }

    const chNum = getChapterNumber(trimmed);
    if (chNum !== null) {
      currentChapter = {
        id: `b3-c${chNum}`,
        title: `Chapter ${trimmed}`,
        subtitle: "",
        chapterNumber: chNum,
        content: [],
        order: chNum,
        isPreview: false,
        status: "Published"
      };
      sections[0].chapters.push(currentChapter);
    } else {
      if (currentChapter) {
        currentChapter.content.push(`<p>${trimmed}</p>`);
      }
    }
  }

  const book3 = {
    id: "book-3",
    order: 3,
    title: "Rhapsodies of the Coming Regent",
    subtitle: "",
    author: "Lizzy",
    cover: "/assets/books/rhapsodies-coming-regent.jpeg",
    price: 4882,
    usdPrice: 3.59,
    status: "Published",
    preview: false,
    blurb: "Through Rakiya’s prophetic art, Lizzy uncovers the final mystery that turns grief into revelation and darkness into hope.",
    sections
  };

  return book3;
}

function normalizeBook1(book) {
  const normalizedSections = [];
  
  // Section 1
  const s1 = book.sections[0];
  const normalizedChaptersS1 = s1.chapters.map((ch, idx) => ({
    ...ch,
    id: `b1-c${idx}`,
    order: idx + 1,
    chapterNumber: idx
  }));
  normalizedSections.push({
    ...s1,
    id: "b1-s1",
    order: 1,
    chapters: normalizedChaptersS1
  });

  // Section 2
  const s2 = book.sections[1];
  const normalizedChaptersS2 = s2.chapters.map((ch, idx) => ({
    ...ch,
    id: `b1-c${idx + 15}`,
    order: idx + 1,
    chapterNumber: idx + 15
  }));
  normalizedSections.push({
    ...s2,
    id: "b1-s2",
    order: 2,
    chapters: normalizedChaptersS2
  });

  // Section 3
  const s3 = book.sections[2];
  const normalizedChaptersS3 = s3.chapters.map((ch, idx) => ({
    ...ch,
    id: `b1-c${idx + 30}`,
    order: idx + 1,
    chapterNumber: idx + 30
  }));
  normalizedSections.push({
    ...s3,
    id: "b1-s3",
    order: 3,
    chapters: normalizedChaptersS3
  });

  return {
    ...book,
    id: "book-1",
    order: 1,
    sections: normalizedSections
  };
}

function normalizeBook2(book) {
  const normalizedSections = [];
  
  // Section 1
  const s1 = book.sections[0];
  const normalizedChaptersS1 = s1.chapters.map((ch, idx) => ({
    ...ch,
    id: `b2-c${idx + 1}`,
    order: idx + 1,
    chapterNumber: idx + 1
  }));
  normalizedSections.push({
    ...s1,
    id: "b2-s1",
    order: 1,
    chapters: normalizedChaptersS1
  });

  // Section 2
  const s2 = book.sections[1];
  const normalizedChaptersS2 = s2.chapters.map((ch, idx) => ({
    ...ch,
    id: `b2-c${idx + 15}`,
    order: idx + 1,
    chapterNumber: idx + 15
  }));
  normalizedSections.push({
    ...s2,
    id: "b2-s2",
    order: 2,
    chapters: normalizedChaptersS2
  });

  return {
    ...book,
    id: "book-2",
    order: 2,
    sections: normalizedSections
  };
}

async function migrateState(statePath) {
  const raw = await readFile(statePath, "utf8");
  const state = JSON.parse(raw);

  const b1 = state.books.find(b => b.title.includes("Disciples"));
  const b2 = state.books.find(b => b.title.includes("Merchants"));

  if (!b1 || !b2) {
    throw new Error("Could not find Book 1 or Book 2 in " + statePath);
  }

  const normalizedB1 = normalizeBook1(b1);
  const normalizedB2 = normalizeBook2(b2);
  const parsedB3 = await parseBook3();

  // Re-assemble the books array, keeping orders intact
  state.books = [normalizedB1, normalizedB2, parsedB3];
  state.serverSavedAt = new Date().toISOString();

  await writeFile(statePath, JSON.stringify(state, null, 2), "utf8");
  console.log(`Migration complete for: ${statePath}`);
  console.log(`  Book 1 chapters: ${normalizedB1.sections.reduce((sum, s) => sum + s.chapters.length, 0)}`);
  console.log(`  Book 2 chapters: ${normalizedB2.sections.reduce((sum, s) => sum + s.chapters.length, 0)}`);
  console.log(`  Book 3 chapters: ${parsedB3.sections[0].chapters.length}`);
}

async function run() {
  const nextStatePath = join(process.cwd(), "data", "next-state.json");
  const statePath = join(process.cwd(), "data", "state.json");

  await migrateState(nextStatePath);
  await migrateState(statePath);
}

run().catch(console.error);

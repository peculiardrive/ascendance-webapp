import { adminSessionFrom, assertSameOrigin } from "@/lib/session";
import { json, readState, uid, writeState } from "@/lib/store";
import mammoth from "mammoth";

export const maxDuration = 60; // Parsing large books can take a while
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    assertSameOrigin(request);
    const adminSession = adminSessionFrom(request);
    if (!adminSession) {
      return json({ ok: false, error: "Unauthorized." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!file) {
      return json({ ok: false, error: "No file uploaded." }, { status: 400 });
    }

    // 1. Extract raw text from the file
    let rawText = "";
    if (file.name.endsWith(".docx")) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await mammoth.extractRawText({ buffer });
      rawText = result.value;
    } else if (file.name.endsWith(".txt")) {
      rawText = await file.text();
    } else {
      return json({ ok: false, error: "Unsupported file type. Please upload a .docx or .txt file." }, { status: 400 });
    }

    // 2. Parse the text into Series and Chapters
    const lines = rawText.split(/\r?\n/);
    
    const parsedSections = [];
    let currentSection = null;
    let currentChapter = null;
    let sectionOrder = 1;

    const NUMBER_WORDS_MAP = {
      "PROLOGUE": 0,
      "ONE": 1, "TWO": 2, "THREE": 3, "FOUR": 4, "FIVE": 5, "SIX": 6, "SEVEN": 7, "EIGHT": 8, "NINE": 9, "TEN": 10,
      "ELEVEN": 11, "TWELVE": 12, "THIRTEEN": 13, "FOURTEEN": 14, "FIFTEEN": 15, "SIXTEEN": 16, "SEVENTEEN": 17, "EIGHTEEN": 18, "NINETEEN": 19, "TWENTY": 20,
      "TWENTYONE": 21, "TWENTYTWO": 22, "TWENTYTHREE": 23, "TWENTYFOUR": 24, "TWENTYFIVE": 25, "TWENTYSIX": 26, "TWENTYSEVEN": 27, "TWENTYEIGHT": 28, "TWENTYNINE": 29, "THIRTY": 30,
      "THIRTYONE": 31, "THIRTYTWO": 32, "THIRTYTHREE": 33, "THIRTYFOUR": 34, "THIRTYFIVE": 35, "THIRTYSIX": 36, "THIRTYSEVEN": 37, "THIRTYEIGHT": 38, "THIRTYNINE": 39, "FORTY": 40,
      "FORTYONE": 41, "FORTYTWO": 42, "FORTYTHREE": 43, "FORTYFOUR": 44, "FORTYFIVE": 45, "FORTYSIX": 46, "FORTYSEVEN": 47, "FORTYEIGHT": 48, "FORTYNINE": 49, "FIFTY": 50
    };

    const isSeriesHeading = (line) => {
      return /^(book\s+one|book\s+two|book\s+three|part|series|section)/i.test(line);
    };

    const getChapterNumber = (line) => {
      const normalized = line.replace(/[\s-]/g, "").toUpperCase();
      if (NUMBER_WORDS_MAP[normalized] !== undefined) {
        return NUMBER_WORDS_MAP[normalized];
      }
      return null;
    };

    for (let line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (isSeriesHeading(trimmed)) {
        const isBookOne = /book\s+one/i.test(trimmed);
        
        // Skip duplicate BOOK ONE section heading if the default section exists
        if (isBookOne && parsedSections.some(s => /book\s+one/i.test(s.title))) {
          currentChapter = null;
          continue;
        }

        currentSection = {
          id: uid("section"),
          title: trimmed,
          subtitle: "",
          price: parsedSections.length > 0 ? 1500 : 0, // Book 1 (Section 1) is free, others are 1500
          order: sectionOrder++,
          tts: true,
          voice: "Female",
          chapters: []
        };
        parsedSections.push(currentSection);
        currentChapter = null;
        continue;
      }

      const chNum = getChapterNumber(trimmed);
      if (chNum !== null) {
        // Enforce default Section if missing
        if (!currentSection) {
          currentSection = {
            id: uid("section"),
            title: "BOOK ONE: THE FORMATION",
            subtitle: "",
            price: 0,
            order: sectionOrder++,
            tts: true,
            voice: "Female",
            chapters: []
          };
          parsedSections.push(currentSection);
        }

        currentChapter = {
          id: uid("chapter"),
          title: trimmed === "PROLOGUE" ? "Prologue" : `Chapter ${trimmed}`,
          subtitle: "",
          chapterNumber: chNum,
          content: [],
          order: currentSection.chapters.length + 1,
          isPreview: false,
          status: "Published"
        };
        currentSection.chapters.push(currentChapter);
      } else {
        if (currentChapter) {
          currentChapter.content.push(`<p>${trimmed}</p>`);
        }
      }
    }

    // 3. Construct the full Book object
    const bookId = uid("book");
    const book = {
      id: bookId,
      title: formData.get("title") || "Untitled Book",
      subtitle: formData.get("subtitle") || "",
      author: formData.get("author") || "BrandZilla Technologies",
      cover: formData.get("cover") || "/assets/books/disciples-inverted-cross.jpeg",
      price: Number(formData.get("price")) || 0,
      usdPrice: Number(formData.get("usdPrice")) || 0,
      status: formData.get("status") || "Published",
      preview: formData.get("preview") === "true",
      blurb: formData.get("blurb") || "",
      order: 1, // Will be updated below
      sections: parsedSections
    };

    // 4. Save to state
    const state = await readState();
    book.order = state.books.length + 1;
    state.books.push(book);
    await writeState(state);

    return json({ ok: true, book });
  } catch (error) {
    console.error("Import error:", error);
    return json({ ok: false, error: error.message }, { status: error.status || 500 });
  }
}

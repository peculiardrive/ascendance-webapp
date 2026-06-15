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
    let chapterOrder = 1;

    // Helper to ensure we have a section to put chapters into
    const ensureSection = () => {
      if (!currentSection) {
        currentSection = {
          id: uid("section"),
          title: "Book One", // Default title if none provided
          subtitle: "",
          price: 0,
          order: sectionOrder++,
          tts: true,
          voice: "Female",
          chapters: []
        };
        parsedSections.push(currentSection);
      }
    };

    // Helper to ensure we have a chapter to put content into
    const ensureChapter = () => {
      ensureSection();
      if (!currentChapter) {
        currentChapter = {
          id: uid("chapter"),
          title: "Prologue", // Default if text appears before first chapter heading
          subtitle: "",
          chapterNumber: chapterOrder++,
          content: [],
          order: currentSection.chapters.length + 1,
          isPreview: false,
          status: "Published"
        };
        currentSection.chapters.push(currentChapter);
      }
    };

    const isSeriesHeading = (line) => /^(book|part|series|section)\s/i.test(line);
    const isChapterHeading = (line) => /^chapter\s/i.test(line);

    for (let line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue; // Skip blank lines

      if (isSeriesHeading(trimmed)) {
        // Start a new section
        currentSection = {
          id: uid("section"),
          title: trimmed,
          subtitle: "",
          price: 0,
          order: sectionOrder++,
          tts: true,
          voice: "Female",
          chapters: []
        };
        parsedSections.push(currentSection);
        currentChapter = null; // Reset chapter for new section
      } else if (isChapterHeading(trimmed)) {
        // Start a new chapter
        ensureSection();
        currentChapter = {
          id: uid("chapter"),
          title: trimmed,
          subtitle: "",
          chapterNumber: chapterOrder++,
          content: [],
          order: currentSection.chapters.length + 1,
          isPreview: false,
          status: "Published"
        };
        currentSection.chapters.push(currentChapter);
      } else {
        // Regular content
        ensureChapter();
        // Convert plain text paragraph to HTML paragraph format used by reader
        currentChapter.content.push(`<p>${trimmed}</p>`);
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

import { PrismaClient } from "@prisma/client";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { seedBooks } from "../lib/seed.js";

const prisma = new PrismaClient();

async function main() {
  let books = seedBooks;
  try {
    const nextStatePath = join(process.cwd(), "data", "next-state.json");
    const raw = await readFile(nextStatePath, "utf8");
    const state = JSON.parse(raw);
    if (state && state.books) {
      books = state.books;
      console.log(`Loaded ${books.length} books from next-state.json for seeding.`);
    }
  } catch (err) {
    console.log("Using default seedBooks from lib/seed.js (next-state.json not found or invalid).");
  }

  // Clear existing catalog to prevent orphan UUID sections/chapters
  console.log("Clearing existing Book, Section, and Chapter records...");
  await prisma.chapter.deleteMany({});
  await prisma.section.deleteMany({});
  await prisma.book.deleteMany({});

  for (const book of books) {
    console.log(`Seeding Book: "${book.title}" (ID: ${book.id})...`);
    await prisma.book.create({
      data: {
        id: book.id,
        title: book.title,
        subtitle: book.subtitle || "",
        author: book.author,
        coverImage: book.cover,
        blurb: book.blurb,
        summary: book.summary || "",
        bookOrder: book.order,
        price: book.price,
        status: book.status,
        freePreviewEnabled: book.preview ?? false
      }
    });

    for (const section of book.sections) {
      console.log(`  Seeding Section: "${section.title}" (ID: ${section.id})...`);
      await prisma.section.create({
        data: {
          id: section.id,
          bookId: book.id,
          title: section.title,
          subtitle: section.subtitle || "",
          orderNumber: section.order,
          price: section.price,
          status: "Published",
          ttsEnabled: section.tts ?? true,
          ttsVoice: section.voice || "Female"
        }
      });

      for (const [index, chapter] of section.chapters.entries()) {
        await prisma.chapter.create({
          data: {
            id: chapter.id,
            bookId: book.id,
            sectionId: section.id,
            chapterTitle: chapter.title,
            chapterSubtitle: chapter.subtitle || "",
            chapterNumber: chapter.chapterNumber ?? (index + 1),
            content: chapter.content,
            orderNumber: chapter.order || (index + 1),
            isPreview: chapter.isPreview ?? false,
            status: chapter.status || "Published"
          }
        });
      }
    }
  }

  console.log("Seeding complete.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

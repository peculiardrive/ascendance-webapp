import { PrismaClient } from "@prisma/client";
import { seedBooks } from "../lib/seed.js";

const prisma = new PrismaClient();

async function upsertBook(book) {
  await prisma.book.upsert({
    where: { id: book.id },
    update: {
      title: book.title,
      subtitle: book.subtitle,
      author: book.author,
      coverImage: book.cover,
      blurb: book.blurb,
      bookOrder: book.order,
      price: book.price,
      status: book.status,
      freePreviewEnabled: book.preview
    },
    create: {
      id: book.id,
      title: book.title,
      subtitle: book.subtitle,
      author: book.author,
      coverImage: book.cover,
      blurb: book.blurb,
      bookOrder: book.order,
      price: book.price,
      status: book.status,
      freePreviewEnabled: book.preview
    }
  });

  for (const section of book.sections) {
    await prisma.section.upsert({
      where: { id: section.id },
      update: {
        bookId: book.id,
        title: section.title,
        subtitle: section.subtitle,
        orderNumber: section.order,
        price: section.price,
        status: "Published",
        ttsEnabled: section.tts,
        ttsVoice: section.voice
      },
      create: {
        id: section.id,
        bookId: book.id,
        title: section.title,
        subtitle: section.subtitle,
        orderNumber: section.order,
        price: section.price,
        status: "Published",
        ttsEnabled: section.tts,
        ttsVoice: section.voice
      }
    });

    for (const [index, chapter] of section.chapters.entries()) {
      await prisma.chapter.upsert({
        where: { id: chapter.id },
        update: {
          bookId: book.id,
          sectionId: section.id,
          chapterTitle: chapter.title,
          chapterSubtitle: chapter.subtitle,
          chapterNumber: index + 1,
          content: chapter.content,
          orderNumber: index + 1,
          isPreview: chapter.isPreview,
          status: chapter.status
        },
        create: {
          id: chapter.id,
          bookId: book.id,
          sectionId: section.id,
          chapterTitle: chapter.title,
          chapterSubtitle: chapter.subtitle,
          chapterNumber: index + 1,
          content: chapter.content,
          orderNumber: index + 1,
          isPreview: chapter.isPreview,
          status: chapter.status
        }
      });
    }
  }
}

async function main() {
  for (const book of seedBooks) {
    await upsertBook(book);
  }

  console.log(`Seeded ${seedBooks.length} Ascendance books.`);
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

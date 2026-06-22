import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  const books = await prisma.book.findMany({
    include: {
      sections: {
        include: {
          chapters: true
        }
      }
    }
  });
  
  for (const b of books) {
    console.log(`\nBook: "${b.title}" (ID: ${b.id})`);
    for (const sec of b.sections) {
      console.log(`  Section: "${sec.title}" (ID: ${sec.id}), Chapters count: ${sec.chapters.length}`);
      if (sec.chapters.length > 0) {
        console.log(`    First Chapter: "${sec.chapters[0].chapterTitle}"`);
      }
    }
  }
}

run()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
  });

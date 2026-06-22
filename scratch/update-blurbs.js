// Updates the three book blurbs and summaries in the live Prisma DB
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BOOKS_UPDATE = {
  "book-1": {
    blurb: "A forbidden order rises beneath the surface of ordinary faith, and a young reader is drawn into the cost of discernment. Ascendance begins where hidden loyalties, ambition, and sacrifice collide.",
    summary: "Unconsciously, he established the evidence of system he’s a truce breaker.\n\nAlthough his father, Rev. Joseph Obiajulu had avowed him to God to be a priest, a vow that saved him from death, he absconded from home in pursuit of his dream to become a medical doctor. Then he breached his promise to Ifeanyi, his elder brother, not to join the university’s secret fraternity, a promise that was sealed with the gift of a golden chain and a crucifix pendant.\n\nBut when he violated his consecration vow as Hangman of the dreaded Inverted Cross Fraternity, he was forced to give up the hammer, the medallion and the armband.\nTo escape the penalty of his transgression, he adopted a new name…Jehoshaphat.\n\nHe became an apostate and swore to destroy the fraternity he founded… one promise he didn’t fail."
  },
  "book-2": {
    blurb: "Sammy’s exile exposes a hidden network where politicians, patrons, and power brokers harvest young dreams.",
    summary: "He laid the Cross upright on the grave of the man who founded the fraternity, and by that single act, Sammy Briggs became both a truce breaker and a marked man.\n\nOnce ordained as Lethal Weapon, the feared Cardinal of the Inverted Cross Fraternity, he had lived by violence, loyalty, and the illusion of power. But when he rejected the political machine of the GODs and the fraternity’s blood economy, and chose the Crucified One over the gods of the Order, the family that once protected him became the darkness hunting him.\n\nTo escape the penalty of his defection, he fled into exile. Stripped of rank, money, protection, and identity, Sammy discovered that the gifts he had once used to mentor boys into darkness could be redeemed to guide wounded young people toward purpose.\n\nAnd though the GODs came for him again, Sammy Briggs had found the one thing stronger than fear — purpose."
  },
  "book-3": {
    blurb: "Through Rakiya’s prophetic art, Lizzy uncovers the final mystery that turns grief into revelation and darkness into hope.",
    summary: "She thought she was only keeping faith with the memory of the man she loved.\n\nBut when Sammy Briggs is arrested, Rakiya disappears, and the paintings of an untrained girl begin to speak with the language of prophecy, Elizabeth finds herself drawn into the unfinished purpose of Ikenna Obiajulu’s death. Once known on campus for charm, beauty, and controversy, Lizzy has become a witness of the Cross she once scarcely understood.\n\nCarrying the burden of three disciples of the Inverted Cross, she traces the hidden merchants who traffic not only in bodies, art, influence, and money — but in destinies. To rescue the girl, save Sammy, and expose the system, Ifeanyi must betray the man who once sheltered him, confront the guilt of leading Ikenna into Dike’s house, and return to the father he abandoned.\n\nAnd through Rakiya’s prophetic paintings, the story finally rises into its true crescendo: The Regent is coming. And the Cross that darkness tried to invert has become the way home."
  }
};

async function run() {
  for (const [id, data] of Object.entries(BOOKS_UPDATE)) {
    const result = await prisma.book.update({
      where: { id },
      data: {
        blurb: data.blurb,
        summary: data.summary
      }
    });
    console.log(`✓ ${result.title} — updated blurb and summary`);
  }
  await prisma.$disconnect();
  console.log('\nDone.');
}

run().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});


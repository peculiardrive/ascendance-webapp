export const seedBooks = [
  {
    id: "book-1",
    order: 1,
    title: "Disciples of the Inverted Cross",
    subtitle: "",
    author: "Ikenna Obiajulu",
    cover: "/assets/books/disciples-inverted-cross.jpeg",
    price: 3522,
    usdPrice: 2.59,
    status: "Published",
    preview: true,
    blurb:
      "A forbidden order rises beneath the surface of ordinary faith, and a young reader is drawn into the cost of discernment. Ascendance begins where hidden loyalties, ambition, and sacrifice collide.",
    summary:
      "Unconsciously, he established the evidence of system he’s a truce breaker.\n\nAlthough his father, Rev. Joseph Obiajulu had avowed him to God to be a priest, a vow that saved him from death, he absconded from home in pursuit of his dream to become a medical doctor. Then he breached his promise to Ifeanyi, his elder brother, not to join the university’s secret fraternity, a promise that was sealed with the gift of a golden chain and a crucifix pendant.\n\nBut when he violated his consecration vow as Hangman of the dreaded Inverted Cross Fraternity, he was forced to give up the hammer, the medallion and the armband.\nTo escape the penalty of his transgression, he adopted a new name…Jehoshaphat.\n\nHe became an apostate and swore to destroy the fraternity he founded… one promise he didn’t fail.",
    sections: [
      {
        id: "b1-s1",
        title: "Book 1 – The Formation",
        subtitle: "by Ikenna Obiajulu",
        order: 1,
        price: 0,
        tts: true,
        voice: "Female",
        chapters: [
          {
            id: "b1-c0",
            title: "Prologue",
            subtitle: "A Sign in the Dust",
            isPreview: true,
            status: "Published",
            content: [
              "The city did not wake at once. It stirred in pieces: a shutter opened, a kettle sighed, a bell struck the hour with the weary certainty of something older than memory.",
              "Elias stood at the crossing and watched the dust arrange itself into the shape of a warning. It was there only for a breath, a slanted mark under the morning sun, but his heart recognized what his mind refused to name.",
              "By noon, the mark had vanished. By evening, three men in black coats were asking for him by name.",
              "He should have run then. Instead, he opened the old journal his mother had hidden beneath the floorboards and read the sentence that would divide his life in two."
            ]
          },
          ...Array.from({ length: 14 }, (_, i) => ({
            id: `b1-c${i + 1}`,
            title: `Chapter ${i + 1}`,
            subtitle: `Formation Stage ${i + 1}`,
            isPreview: true,
            status: "Published",
            content: [
              `This is chapter ${i + 1} of Book One: The Formation. The journey deepens as Elias unravels the secrets of the inverted cross.`,
              `Paragraph two of chapter ${i + 1}. The shadows of the past continue to loom over the city as the order gathers its strength.`,
              `The final warning was clear, but Elias chose to press forward regardless of the cost.`
            ]
          }))
        ]
      },
      {
        id: "b1-s2",
        title: "Book 2 – The Fall",
        subtitle: "by the Seagull",
        order: 2,
        price: 1500,
        tts: true,
        voice: "Male",
        chapters: [
          {
            id: "b1-c15",
            title: "Chapter 15",
            subtitle: "Descending Shadows",
            isPreview: false,
            status: "Published",
            content: [
              "There are houses built upward for the pride of the living, and there are houses built downward for the secrecy of the afraid.",
              "Elias found the stair behind a wall of flour sacks. Each step carried the smell of rain, iron, and old wax. Somewhere below, voices moved in practiced whispers.",
              "When the final door opened, every candle in the room bowed toward him as if the flame itself had been expecting his arrival."
            ]
          }
        ]
      },
      {
        id: "b1-s3",
        title: "Book 3 – The Fraternity",
        subtitle: "by Albatross",
        order: 3,
        price: 1500,
        tts: true,
        voice: "Male",
        chapters: [
          {
            id: "b1-c16",
            title: "Chapter 16",
            subtitle: "The Witness",
            isPreview: false,
            status: "Published",
            content: [
              "The witness was younger than Elias expected and far less afraid. She sat under the archway with her hands folded, her eyes fixed on the inverted cross cut into the stone.",
              "They told him she had seen the ceremony. They did not tell him she had survived it by answering a question no child should know how to hear.",
              "When she spoke, the room tightened around every word."
            ]
          }
        ]
      }
    ]
  },
  {
    id: "book-2",
    order: 2,
    title: "Merchants of the Ivory Towers",
    subtitle: "",
    author: "Bloody Sniper",
    cover: "/assets/books/merchants-ivory-towers.jpeg",
    price: 4882,
    usdPrice: 3.59,
    status: "Published",
    preview: false,
    blurb:
      "Sammy’s exile exposes a hidden network where politicians, patrons, and power brokers harvest young dreams.",
    summary:
      "He laid the Cross upright on the grave of the man who founded the fraternity, and by that single act, Sammy Briggs became both a truce breaker and a marked man.\n\nOnce ordained as Lethal Weapon, the feared Cardinal of the Inverted Cross Fraternity, he had lived by violence, loyalty, and the illusion of power. But when he rejected the political machine of the GODs and the fraternity’s blood economy, and chose the Crucified One over the gods of the Order, the family that once protected him became the darkness hunting him.\n\nTo escape the penalty of his defection, he fled into exile. Stripped of rank, money, protection, and identity, Sammy discovered that the gifts he had once used to mentor boys into darkness could be redeemed to guide wounded young people toward purpose.\n\nAnd though the GODs came for him again, Sammy Briggs had found the one thing stronger than fear — purpose.",
    sections: [
      {
        id: "b2-s1",
        title: "Book 4 – The Fulcrum",
        subtitle: "by Bloody Sniper",
        order: 1,
        price: 2000,
        tts: true,
        voice: "Female",
        chapters: [
          {
            id: "b2-c1",
            title: "Chapter One",
            subtitle: "Ivory Accounting",
            isPreview: false,
            status: "Published",
            content: [
              "The tower was beautiful in the way a blade is beautiful: clean, reflective, and built for separation.",
              "Inside, no one raised a voice. Contracts did the shouting. Signatures drew blood without staining the page.",
              "Elias learned quickly that every favor had a shadow price."
            ]
          }
        ]
      },
      {
        id: "b2-s2",
        title: "Book 5 – The Firstfruit",
        subtitle: "by the Key",
        order: 2,
        price: 2000,
        tts: true,
        voice: "Female",
        chapters: [
          {
            id: "b2-c2",
            title: "Chapter Two",
            subtitle: "The First Harvest",
            isPreview: false,
            status: "Published",
            content: [
              "The ledgers were heavy, bound in leather that smelled of age and oil. Under the dim lamp, the numbers seemed to squirm.",
              "Every merchant had a code, and every code had a name Elias was warned never to speak aloud."
            ]
          }
        ]
      }
    ]
  },
  {
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
    blurb:
      "Through Rakiya’s prophetic art, Lizzy uncovers the final mystery that turns grief into revelation and darkness into hope.",
    summary:
      "She thought she was only keeping faith with the memory of the man she loved.\n\nBut when Sammy Briggs is arrested, Rakiya disappears, and the paintings of an untrained girl begin to speak with the language of prophecy, Elizabeth finds herself drawn into the unfinished purpose of Ikenna Obiajulu’s death. Once known on campus for charm, beauty, and controversy, Lizzy has become a witness of the Cross she once scarcely understood.\n\nCarrying the burden of three disciples of the Inverted Cross, she traces the hidden merchants who traffic not only in bodies, art, influence, and money — but in destinies. To rescue the girl, save Sammy, and expose the system, Ifeanyi must betray the man who once sheltered him, confront the guilt of leading Ikenna into Dike’s house, and return to the father he abandoned.\n\nAnd through Rakiya’s prophetic paintings, the story finally rises into its true crescendo: The Regent is coming. And the Cross that darkness tried to invert has become the way home.",
    sections: [
      {
        id: "b3-s1",
        title: "Book 6 – The Fulfillment",
        subtitle: "by Lizzy",
        order: 1,
        price: 2500,
        tts: true,
        voice: "Male",
        chapters: [
          {
            id: "b3-c1",
            title: "Chapter One",
            subtitle: "The Music Before Dawn",
            isPreview: false,
            status: "Published",
            content: [
              "Before the regent arrived, the city began to sing.",
              "No choir claimed the sound. It gathered in drains, windows, market stalls, and the trembling string of a violin left untouched in its case.",
              "Those who remembered the first prophecy knelt. Those who mocked it reached for locked doors."
            ]
          }
        ]
      }
    ]
  }
];

export const defaultSettings = {
  bookOnePrice: 3522,
  bookTwoPrice: 4882,
  bookThreePrice: 4882,
  trilogyPrice: 8962,
  giftPrice: 6242,
  bookOnePriceUsd: 2.59,
  bookTwoPriceUsd: 3.59,
  bookThreePriceUsd: 3.59,
  trilogyPriceUsd: 6.59,
  giftPriceUsd: 4.59,
  giftLimit: 5,
  autoApprovePosts: true
};

export const defaultState = {
  users: [],
  books: seedBooks,
  purchases: [],
  transactions: [],
  progress: {},
  gifts: [],
  posts: [
    {
      id: "post-1",
      userId: "reader-demo",
      username: "AdaReads",
      country: "NG",
      bookId: "book-1",
      content: "The opening feels cinematic. I like that the story asks spiritual questions without slowing the pace.",
      likes: 12,
      likedBy: [],
      comments: [
        {
          id: "comment-1",
          user: "Admin",
          country: "HQ",
          avatar: "A",
          text: "Thank you for reading. The next section deepens that tension.",
          parentId: null,
          isAdmin: true,
          createdAt: "2026-05-28T13:00:00.000Z"
        }
      ],
      status: "Visible",
      pinned: true,
      reported: false,
      reports: [],
      createdAt: "2026-05-28T12:00:00.000Z"
    }
  ],
  notifications: [],
  settings: defaultSettings
};

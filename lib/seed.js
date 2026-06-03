export const seedBooks = [
  {
    id: "book-1",
    order: 1,
    title: "Disciples of the Inverted Cross",
    subtitle: "Book One",
    author: "BrandZilla Technologies",
    cover: "/assets/cover-book-1.svg",
    price: 4500,
    status: "Published",
    preview: true,
    blurb:
      "A forbidden order rises beneath the surface of ordinary faith, and a young reader is drawn into the cost of discernment. Ascendance begins where hidden loyalties, ambition, and sacrifice collide.",
    sections: [
      {
        id: "b1-s1",
        title: "The First Disturbance",
        subtitle: "The door opens quietly",
        order: 1,
        price: 0,
        tts: true,
        voice: "Female",
        chapters: [
          {
            id: "b1-c1",
            title: "Chapter One",
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
          {
            id: "b1-c2",
            title: "Chapter Two",
            subtitle: "The House Below",
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
        id: "b1-s2",
        title: "The Hidden Creed",
        subtitle: "A vow beneath a vow",
        order: 2,
        price: 1500,
        tts: true,
        voice: "Male",
        chapters: [
          {
            id: "b1-c3",
            title: "Chapter Three",
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
    subtitle: "Book Two",
    author: "BrandZilla Technologies",
    cover: "/assets/cover-book-2.svg",
    price: 5000,
    status: "Published",
    preview: false,
    blurb:
      "The struggle moves from hidden rooms into polished halls, where influence is traded like currency and truth becomes the most expensive commodity.",
    sections: [
      {
        id: "b2-s1",
        title: "Ledgers of Power",
        subtitle: "The tower keeps its receipts",
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
      }
    ]
  },
  {
    id: "book-3",
    order: 3,
    title: "Rhapsodies of the Coming Regent",
    subtitle: "Book Three",
    author: "BrandZilla Technologies",
    cover: "/assets/cover-book-3.svg",
    price: 5500,
    status: "Published",
    preview: false,
    blurb:
      "The final movement gathers every oath, betrayal, and revelation into the arrival of a regent whose coming will test the meaning of ascendance itself.",
    sections: [
      {
        id: "b3-s1",
        title: "The Crown Unseen",
        subtitle: "A throne before a name",
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
  bookOnePrice: 4500,
  bookTwoPrice: 5000,
  bookThreePrice: 5500,
  trilogyPrice: 12000,
  giftPrice: 9500,
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

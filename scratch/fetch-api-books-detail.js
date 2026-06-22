async function run() {
  const res = await fetch("http://127.0.0.1:3000/api/books");
  const data = await res.json();
  const book3 = data.books.find(b => b.id === "book-3");
  if (book3) {
    const chapter1 = book3.sections[0].chapters[0];
    console.log("Chapter 1:", JSON.stringify(chapter1, null, 2));
  }
}

run().catch(console.error);

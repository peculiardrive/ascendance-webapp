async function run() {
  const res = await fetch("http://127.0.0.1:3000/api/books");
  const data = await res.json();
  if (!data.ok) {
    console.error("API Error:", data);
    return;
  }
  const book3 = data.books.find(b => b.id === "book-3");
  if (!book3) {
    console.log("Book 3 not found in API response");
    return;
  }
  console.log("Book 3 Title:", book3.title);
  console.log("Book 3 Sections:", book3.sections.map(s => ({
    id: s.id,
    title: s.title,
    chaptersCount: s.chapters.length,
    chapters: s.chapters.map(c => ({ id: c.id, title: c.title, locked: c.locked, hasContent: !!c.content }))
  })));
}

run().catch(console.error);

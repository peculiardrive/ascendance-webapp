import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";

const SEARCH_DIR = "c:\\Users\\pecul\\OneDrive\\Documents\\Ascendance WebApp";
const QUERY = "section";

async function search(dir) {
  const entries = await readdir(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    if (entry === "node_modules" || entry === ".git" || entry === ".next" || entry === "scratch" || entry.endsWith(".db")) continue;
    const info = await stat(fullPath);
    if (info.isDirectory()) {
      await search(fullPath);
    } else if (info.isFile()) {
      try {
        const content = await readFile(fullPath, "utf8");
        // We want to find files containing "section" that might be user-facing.
        // Let's print the file names first.
        if (content.toLowerCase().includes(QUERY)) {
          console.log(`Found in: ${fullPath}`);
        }
      } catch (e) {
        // ignore
      }
    }
  }
}

search(SEARCH_DIR).catch(console.error);

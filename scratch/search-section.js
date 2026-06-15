import { readFile } from "node:fs/promises";

async function main() {
  const content = await readFile("app/page.jsx", "utf8");
  const lines = content.split("\n");
  lines.forEach((line, i) => {
    if (line.toLowerCase().includes("section")) {
      console.log(`${i + 1}: ${line.trim()}`);
    }
  });
}

main().catch(console.error);

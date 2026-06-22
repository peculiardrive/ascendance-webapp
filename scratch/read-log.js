import { readFile } from "node:fs/promises";

async function run() {
  const path = "C:\\Users\\pecul\\.gemini\\antigravity-ide\\brain\\aa9e2e0c-6678-4201-9889-5c0d981bf1fd\\.system_generated\\logs\\transcript.jsonl";
  const raw = await readFile(path, "utf8");
  const lines = raw.split("\n").filter(Boolean);
  
  for (const line of lines) {
    try {
      const obj = JSON.parse(line);
      if (obj.type === "USER_INPUT") {
        console.log(`\n--- USER INPUT (Step ${obj.step_index}) ---`);
        console.log(obj.content);
      }
    } catch (e) {
      // Ignore parse errors
    }
  }
}

run();

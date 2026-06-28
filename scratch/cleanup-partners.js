import fs from "node:fs";
import path from "node:path";

function cleanup() {
  const filePath = path.join(process.cwd(), "data", "next-state.json");
  if (fs.existsSync(filePath)) {
    const raw = fs.readFileSync(filePath, "utf8");
    const state = JSON.parse(raw);
    if (state.partners) {
      state.partners = state.partners.filter(p => p.email !== "test.donor@example.com");
      fs.writeFileSync(filePath, JSON.stringify(state, null, 2), "utf8");
      console.log("Cleanup successful. Test donor entries removed from next-state.json.");
    }
  }
}

cleanup();

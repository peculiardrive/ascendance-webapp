import { readFile } from "node:fs/promises";
import { join } from "node:path";

async function run() {
  const path = join(process.cwd(), "data", "next-state.json");
  const raw = await readFile(path, "utf8");
  const state = JSON.parse(raw);
  
  console.log("Users count:", state.users.length);
  console.log("Purchases count:", state.purchases.length);
  console.log("Transactions count:", state.transactions.length);
  console.log("Progress keys:", Object.keys(state.progress));
  console.log("Gifts count:", state.gifts.length);
}

run().catch(console.error);

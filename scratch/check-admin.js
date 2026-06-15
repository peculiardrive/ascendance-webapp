import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

async function main() {
  const users = await p.user.findMany({
    where: { email: "peculiardrive@gmail.com" }
  });
  console.log("Users:", users);
}

main().finally(() => p.$disconnect());

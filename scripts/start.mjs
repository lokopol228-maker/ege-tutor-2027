import { mkdirSync } from "node:fs";
import { spawn } from "node:child_process";

function run(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { stdio: "inherit", shell: true });
    child.on("exit", (code) => resolve(code === 0));
    child.on("error", () => resolve(false));
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

mkdirSync("prisma/data", { recursive: true });

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./prisma/data/prod.db";
}

const maxAttempts = 5;

for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
  console.log(`[start] prisma db push (попытка ${attempt}/${maxAttempts})`);
  const ok = await run("npx", ["prisma", "db", "push"]);
  if (ok) break;

  if (attempt === maxAttempts) {
    console.error("[start] Не удалось создать базу SQLite.");
    process.exit(1);
  }

  await sleep(2000);
}

console.log("[start] seed");
if (!(await run("npm", ["run", "db:seed"]))) {
  process.exit(1);
}

console.log("[start] next start");
const started = await run("npm", ["start"]);
process.exit(started ? 0 : 1);

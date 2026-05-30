import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

process.env.DATABASE_URL ||= "file:./dev.db";

const [command, ...args] = process.argv.slice(2);

if (!command) {
  console.error(
    "Usage: node scripts/with-database-url.mjs <command> [...args]",
  );
  process.exit(1);
}

const localBin = resolve(
  "node_modules",
  ".bin",
  process.platform === "win32" ? `${command}.cmd` : command,
);
const executable = existsSync(localBin) ? localBin : command;

const child =
  process.platform === "win32"
    ? spawn([executable, ...args].map(quoteForShell).join(" "), {
        env: process.env,
        shell: true,
        stdio: "inherit",
      })
    : spawn(executable, args, {
        env: process.env,
        stdio: "inherit",
      });

child.on("exit", (code, signal) => {
  if (signal) {
    console.error(`Command terminated by ${signal}`);
    process.exit(1);
  }
  process.exit(code ?? 1);
});

function quoteForShell(value) {
  if (/^[A-Za-z0-9_./:=\\-]+$/.test(value)) return value;
  return `"${value.replace(/"/g, '\\"')}"`;
}

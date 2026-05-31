import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

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
let executable = existsSync(localBin) ? localBin : command;
let executableArgs = args;

if (process.platform === "win32" && existsSync(localBin)) {
  const shimTarget = resolveWindowsNodeShim(localBin);
  if (shimTarget) {
    executable = process.execPath;
    executableArgs = [shimTarget, ...args];
  }
}

const child = spawn(executable, executableArgs, {
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

function resolveWindowsNodeShim(cmdPath) {
  const content = readFileSync(cmdPath, "utf8");
  const match = content.match(/"%dp0%\\(\.\.[^"]+)"/);
  return match ? resolve(dirname(cmdPath), match[1]) : null;
}

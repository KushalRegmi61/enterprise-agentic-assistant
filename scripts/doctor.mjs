#!/usr/bin/env node
// Preflight environment check for enterprise-agentic-assistant.
// Agent-only scope: no B2 / Supabase / Stripe requirements.
// Zero dependencies (node:* core only) so this works on a fresh clone.

import { existsSync, readFileSync } from "node:fs";
import { createServer } from "node:net";
import { execSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ENV_FILE = resolve(REPO_ROOT, ".env");
const VENV_UVICORN = resolve(REPO_ROOT, ".venv/bin/uvicorn");

const REQUIRED_NODE_MAJOR = 20;
const REQUIRED_PNPM_MAJOR = 9;
const REQUIRED_PYTHON_MINOR = 11; // 3.11+

// Warn (don't fail) when these are empty placeholders — the agent boots
// but /ingest answers 503 and chat needs a real key.
const WARN_IF_EMPTY = [
  "OPENAI_API_KEY",
  "AGENTIC_ASSISTANT_SERVICE_TOKEN",
  "AGENTIC_ASSISTANT_DATABASE_URL",
];

const PORTS_TO_CHECK = [{ port: 3001, name: "assistant-web dev server" }];

const failures = [];
const warnings = [];

function fail(msg, fix) {
  failures.push({ msg, fix });
}
function warn(msg, fix) {
  warnings.push({ msg, fix });
}
function tryExec(cmd) {
  try {
    return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return null;
  }
}
function parseSemver(s) {
  const match = s.match(/(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return { major: +match[1], minor: +match[2], patch: +match[3] };
}
function checkNode() {
  const v = parseSemver(process.version);
  if (!v || v.major < REQUIRED_NODE_MAJOR) {
    fail(`Node ${process.version} is too old (need >= ${REQUIRED_NODE_MAJOR}.0.0)`, `Install via nvm/fnm: \`nvm install ${REQUIRED_NODE_MAJOR}\``);
  }
}
function checkPnpm() {
  const out = tryExec("pnpm --version");
  if (!out) {
    fail("pnpm is not installed", "Install via corepack: `corepack enable && corepack prepare pnpm@latest --activate`");
    return;
  }
  const v = parseSemver(out);
  if (!v || v.major < REQUIRED_PNPM_MAJOR) {
    fail(`pnpm ${out} is too old (need >= ${REQUIRED_PNPM_MAJOR})`, "Run: `corepack prepare pnpm@latest --activate`");
  }
}
function checkPython() {
  for (const bin of ["python3", "python3.13", "python3.12", "python3.11", "python"]) {
    const out = tryExec(`${bin} --version`);
    if (!out) continue;
    const v = parseSemver(out);
    if (v && v.major >= 3 && v.minor >= REQUIRED_PYTHON_MINOR) return;
  }
  fail("Python 3.11+ is not on PATH", "Install Python 3.11+ via brew/pyenv/python.org");
}
function checkVenv() {
  if (!existsSync(VENV_UVICORN)) {
    fail("Backend virtualenv not set up (.venv/bin/uvicorn missing)", "Run: `uv sync --all-packages --all-groups` from the repo root");
  }
}
function parseEnvFile(path) {
  const out = {};
  for (const raw of readFileSync(path, "utf8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
    out[line.slice(0, eq).trim()] = val;
  }
  return out;
}
function checkEnv() {
  if (!existsSync(ENV_FILE)) {
    fail(".env is missing at the repo root", "Run: `cp .env.example .env`, then fill in OPENAI_API_KEY + AGENTIC_ASSISTANT_*");
    return;
  }
  const env = parseEnvFile(ENV_FILE);
  for (const k of WARN_IF_EMPTY) {
    if (!env[k]) warn(`.env has no ${k} — agent boots degraded (/ingest 503 until set)`, "See .env.example");
  }
}
function isPortBoundOn(port, host) {
  return new Promise((res) => {
    const server = createServer();
    server.once("error", (err) => res(err.code === "EADDRINUSE"));
    server.once("listening", () => server.close(() => res(false)));
    server.listen(port, host);
  });
}
async function checkPort({ port, name }) {
  const [v4, v6] = await Promise.all([isPortBoundOn(port, "0.0.0.0"), isPortBoundOn(port, "::")]);
  if (v4 || v6) warn(`Port ${port} (${name}) is already in use`, "ok — dev.sh picks the next free port automatically.");
}
async function main() {
  checkNode();
  checkPnpm();
  checkPython();
  checkVenv();
  checkEnv();
  await Promise.all(PORTS_TO_CHECK.map(checkPort));
  if (failures.length === 0 && warnings.length === 0) {
    console.log("✓ doctor: environment looks good");
    return;
  }
  if (warnings.length > 0) {
    console.error("\n⚠  Warnings:");
    for (const { msg, fix } of warnings) {
      console.error(`  - ${msg}`);
      console.error(`    fix: ${fix}`);
    }
  }
  if (failures.length > 0) {
    console.error("\n✗ Errors:");
    for (const { msg, fix } of failures) {
      console.error(`  - ${msg}`);
      console.error(`    fix: ${fix}`);
    }
    console.error("");
    process.exit(1);
  }
  console.error("\nProceeding despite warnings.\n");
}
main();

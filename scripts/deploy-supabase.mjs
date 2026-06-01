#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const supabaseDir = join(root, "supabase");
const functionsDir = join(supabaseDir, "functions");
const linkedProjectRefPath = join(supabaseDir, ".temp", "project-ref");

const args = process.argv.slice(2);

function readFlag(name) {
  const index = args.indexOf(name);
  if (index === -1) {
    return null;
  }

  return args[index + 1] && !args[index + 1].startsWith("--") ? args[index + 1] : "";
}

function hasFlag(name) {
  return args.includes(name);
}

const projectRef =
  readFlag("--project-ref") ||
  process.env.SUPABASE_PROJECT_REF ||
  (existsSync(linkedProjectRefPath) ? readFileSync(linkedProjectRefPath, "utf8").trim() : "");

const selectedFunctions = readFlag("--functions")
  ?.split(",")
  .map((name) => name.trim())
  .filter(Boolean);

const skipLink = hasFlag("--skip-link");
const skipDb = hasFlag("--skip-db");
const skipFunctions = hasFlag("--skip-functions");

function run(command, commandArgs) {
  console.log(`\n> ${command} ${commandArgs.join(" ")}`);

  const result = spawnSync(command, commandArgs, {
    cwd: root,
    shell: true,
    stdio: "inherit",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function assertSupabaseProject() {
  if (!existsSync(supabaseDir)) {
    console.error("Missing supabase directory. Run this from the project root.");
    process.exit(1);
  }
}

function getFunctionNames() {
  if (!existsSync(functionsDir)) {
    return [];
  }

  return readdirSync(functionsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => !name.startsWith("_"))
    .sort();
}

function printUsage() {
  console.log(`
Deploy Supabase migrations and Edge Functions.

Usage:
  node scripts/deploy-supabase.mjs --project-ref <ref>
  bun run supabase:deploy -- --project-ref <ref>

Options:
  --project-ref <ref>       Supabase project reference. Also reads SUPABASE_PROJECT_REF.
  --functions <a,b,c>       Deploy only these comma-separated function names.
  --skip-link               Do not run supabase link.
  --skip-db                 Do not run supabase db push.
  --skip-functions          Do not deploy Edge Functions.

Before running:
  supabase login
`);
}

if (hasFlag("--help") || hasFlag("-h")) {
  printUsage();
  process.exit(0);
}

assertSupabaseProject();
run("supabase", ["--version"]);

if (!skipLink && projectRef) {
  run("supabase", ["link", "--project-ref", projectRef]);
} else if (!projectRef) {
  console.log("\nNo project ref provided. Using the currently linked Supabase project.");
}

if (!skipDb) {
  run("supabase", ["db", "push"]);
}

if (!skipFunctions) {
  const functionNames = selectedFunctions?.length ? selectedFunctions : getFunctionNames();

  if (!functionNames.length) {
    console.log("\nNo Edge Function directories found.");
  }

  for (const functionName of functionNames) {
    const deployArgs = ["functions", "deploy", functionName];

    if (projectRef) {
      deployArgs.push("--project-ref", projectRef);
    }

    run("supabase", deployArgs);
  }
}

console.log("\nSupabase deployment complete.");

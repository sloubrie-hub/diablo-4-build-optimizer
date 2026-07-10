#!/usr/bin/env node
const { spawnSync } = require("child_process");
const path = require("path");

const cliPath = path.join(__dirname, "d4export.js");
const result = spawnSync(process.execPath, [cliPath, "scan", ...process.argv.slice(2)], {
  stdio: "inherit",
});

process.exit(result.status ?? 1);

#!/usr/bin/env node

const args = process.argv.slice(2);

const command = args[0];
if (command === "init") {
  const { initSvelteApp } = require("../dist/init/index.js");
  initSvelteApp(args[1]);
} else {
  const { startDevServer } = require("../dist/serve/index.js");
  startDevServer(args[0] || ".");
}

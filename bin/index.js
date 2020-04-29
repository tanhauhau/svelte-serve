#!/usr/bin/env node

const args = process.argv.slice(2);

const { startDevServer } = require('../dist/index.js');
startDevServer(args[0] || '.');
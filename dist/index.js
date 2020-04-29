"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const koa_1 = __importDefault(require("koa"));
const chalk_1 = __importDefault(require("chalk"));
function startDevServer(root) {
    const app = new koa_1.default();
    const server = http_1.default.createServer(app.callback());
    let port = 3000;
    server.on('error', (error) => {
        // @ts-ignore
        if (error.code === 'EADDRINUSE') {
            setTimeout(() => {
                server.close();
                server.listen(++port);
            }, 100);
        }
        else {
            console.log(chalk_1.default.red('server error:'));
            console.error(error);
        }
    });
    server.on('listening', () => {
        console.log(chalk_1.default.green('Dev server running at:'));
        console.log(`  > http://localhost:${port}`);
        console.log(' ');
    });
    server.listen(port);
}
exports.startDevServer = startDevServer;
// import http from 'http';
// const http = require('http');
// const app = require('./server');
// let port = 8080;
// const server = http.createServer(app);

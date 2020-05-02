import WebSocket from "ws";
import { Server } from "http";
import chalk from "chalk";

let wss;
let id = 0;
const sockets = new Map<number, WebSocket>();

export function initialiseWebSocketServer(server: Server) {
  wss = new WebSocket.Server({ server });
  wss.on("connection", (socket) => {
    let _id = id++;
    sockets.set(_id, socket);
    socket.send(JSON.stringify({ type: "connected", id: _id }));
    socket.on("close", () => {
      sockets.delete(_id);
    });
  });

  wss.on("error", (e: Error & { code: string }) => {
    if (e.code !== "EADDRINUSE") {
      console.error(chalk.red(`WebSocket server error:`));
      console.error(e);
    }
  });
}

export function broadcast(message: any) {
  const stringified = JSON.stringify(message, null, 2);
  // console.log(`broadcast message: ${stringified}`);

  sockets.forEach((s) => s.send(stringified));
}

export function send(socketId: number, message: any) {
  const stringified = JSON.stringify(message, null, 2);
//   console.log(`send message to ${socketId}: ${stringified}`);
// console.group(sockets);
  sockets.get(socketId)?.send(stringified);
}

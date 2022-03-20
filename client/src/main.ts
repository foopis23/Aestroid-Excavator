import './style.css'
import * as PIXI from 'pixi.js'
import { useMousePos } from './input'
import { io } from "socket.io-client";
import { PlayerEntity } from './player';
import { GameSocket } from './types';

// configurable
const clientDelay = 100
const clientSmoothing = 7
const TARGET_FPMS = PIXI.settings.TARGET_FPMS ?? 0.06

// get host name
const host = prompt('Enter Host Address')

// game state
let players: Record<string, PlayerEntity> = {}

// create graphics app
const app = new PIXI.Application()
app.stage.interactive = true
document.body.appendChild(app.view)

// setup mouse listener
export const { getMousePos } = useMousePos(app.stage)

// setup websocket
const protocol = (window.location.host.includes('localhost')) ? 'ws' : 'wss'
const socket: GameSocket = io(`${protocol}://${host}`);
socket.serverTime = 0
socket.clientTime = 0
socket.lastPacketTime = Date.now()

// websocket connect
socket.on("connect", () => {
  console.log(socket.id); // x8WIv7-mJelg7on_ALbx
});

socket.on('playerJoin', (id) => {
  players[id] = new PlayerEntity(clientSmoothing, id, id == socket.id)
  app.stage.addChild(players[id])
})

socket.on('playerLeft', (id) => {
  app.stage.removeChild(players[id])
  delete players[id]
})

socket.on('playersSync', (data) => {
  socket.serverTime = data.time
  socket.clientTime = socket.serverTime - clientDelay
  socket.lastPacketTime = Date.now()

  for (const playerData of data.players) {
    const { id } = playerData

    if (players[id] == undefined) {
      players[id] = new PlayerEntity(clientSmoothing, id, id == socket.id)
      app.stage.addChild(players[id])
    }

    players[id].serverUpdates.push({ ...playerData, time: data.time })

    while (players[id].serverUpdates[0].time < socket.clientTime
      && players[id].serverUpdates[1].time < socket.clientTime) {
      players[id].serverUpdates.splice(0, 1)
    }
  }
})

// main game loop
app.ticker.add((deltaFrame: number) => {
  const delta = (deltaFrame / TARGET_FPMS) / 1000

  if (socket.clientTime && socket.lastPacketTime) {
    const currentTime = socket.clientTime + (Date.now() - socket.lastPacketTime)
    for (let playerId of Object.keys(players)) {
      players[playerId].tick(delta, currentTime)
    }
  }

  // if local player, push current input to server
  if (players[socket.id]) {
    const moveInput = players[socket.id].moveInput;
    const lookRot = players[socket.id].lookRot;
    socket.emit('playerInput', { moveInput, lookRot })
  }
})

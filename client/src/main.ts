import './style.css'
import * as PIXI from 'pixi.js'
import { useMousePos } from './input'
import { io } from "socket.io-client";
import { PlayerEntity } from './player';
import { GameSocket } from './types';
import { onPlayerJoin, onPlayerLeave, physicsLoop, world } from '../../core/game'

// configurable
const clientDelay = 100
const clientSmoothing = 7
const TARGET_FPMS = PIXI.settings.TARGET_FPMS ?? 0.06

// get host name
const host = prompt('Enter Host Address')

// create graphics app
const app = new PIXI.Application()
app.stage.interactive = true
document.body.appendChild(app.view)

// setup mouse listener for graphics app
export const { getMousePos } = useMousePos(app.stage)

// setup websocket
const protocol = (window.location.host.includes('localhost')) ? 'ws' : 'wss'
const socket: GameSocket = io(`${protocol}://${host}`);
socket.serverTime = 0
socket.clientTime = 0
socket.lastPacketTime = Date.now()

// websocket connect
socket.on("connect", () => {
  // console.log(socket.id); // x8WIv7-mJelg7on_ALbx
});

socket.on('playerJoin', (id) => {
  const player = new PlayerEntity(clientSmoothing, id, id == socket.id)
  onPlayerJoin(player)
  app.stage.addChild(player)
})

socket.on('playerLeft', (id) => {
  app.stage.removeChild(world.players[id] as PlayerEntity)
  onPlayerLeave(id)
})

socket.on('playersSync', (data) => {
  socket.serverTime = data.time
  socket.clientTime = socket.serverTime - clientDelay
  socket.lastPacketTime = Date.now()

  for (const playerData of data.players) {
    const { id } = playerData

    if (world.players[id] == undefined) {
      // continue;
      const newPlayer = new PlayerEntity(clientSmoothing, id, id == socket.id)
      onPlayerJoin(newPlayer)
      app.stage.addChild(newPlayer)
    }

    const player = world.players[id] as PlayerEntity

    player.serverUpdates.push({ ...playerData, time: data.time })

    while (player.serverUpdates[0].time < socket.clientTime
      && player.serverUpdates[1].time < socket.clientTime) {
        player.serverUpdates.splice(0, 1)
    }
  }
})

// main game loop
app.ticker.add((deltaFrame: number) => {
  const delta = (deltaFrame / TARGET_FPMS) / 1000

  physicsLoop();

  if (socket.clientTime && socket.lastPacketTime) {
    const currentTime = socket.clientTime + (Date.now() - socket.lastPacketTime)
    for (let playerId of Object.keys(world.players)) {
      const player = world.players[playerId] as PlayerEntity
      player.tick(delta, currentTime, world)
    }
  }

  // if local player, push current input to server
  if (world.players[socket.id]) {
    const player = world.players[socket.id] as PlayerEntity
    const lastInput = player.inputs[player.inputs.length - 1]
    
    if (lastInput) {
      socket.emit('playerInput', player.inputs[player.inputs.length - 1])
    }
  }
})

import './style.css'
import * as PIXI from 'pixi.js'
import { useMousePos } from './input'
import { io } from "socket.io-client"
import { ClientPlayerEntity } from './player'
import { GameSocket } from './types'
import { Game } from '../../core/game'
import { PhysicsWorld } from '../../core/physics/world'

// configurable
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

const game = new Game(new PhysicsWorld())

// main game loop
app.ticker.add((deltaFrame: number) => {
  const delta = (deltaFrame / TARGET_FPMS) / 1000

  game.tick();

  if (socket.clientTime && socket.lastPacketTime) {
    const currentTime = socket.clientTime + (Date.now() - socket.lastPacketTime)
    for (const playerId of Object.keys(game.players)) {
      const player = game.players[playerId] as ClientPlayerEntity
      player.tick(delta, currentTime, game.world)
    }
  }

  // if local player, push current input to server
  if (game.players[socket.id]) {
    const player = game.players[socket.id] as ClientPlayerEntity
    const lastInput = player.inputs[player.inputs.length - 1]

    if (lastInput) {
      socket.emit('playerInput', player.inputs[player.inputs.length - 1])
    }
  }
})

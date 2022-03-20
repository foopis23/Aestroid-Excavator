import { World } from '../server/src/types'
import { tickPhysicsBody } from './physics'
import { PlayerInputPacket } from './net'

export const world: World = new World()
const tickRateMS = 1000/60
const playerInputAcceleration = 1000
let lastPhysicsUpdate = Date.now()

export function onPlayerJoin(id : string) {
  world.players[id] = {
    id,
    position: {x: 0, y: 0},
    velocity: {x: 0, y: 0},
    acceleration: {x: 0, y: 0},
    rotation: 0,
    radius: 20,
    moveInput: {x: 0, y: 0},
    lookRot: 0,
    dragScale: 0.8
  }
}

export function onPlayerLeave(id: string) {
  delete world.players[id]
}

export function onPlayerInput(id: string, input: PlayerInputPacket) {
  world.players[id].moveInput = input.moveInput
  world.players[id].lookRot = input.lookRot
}

// gamers loop, rise up
setInterval(() => physicsLoop(), tickRateMS)
function physicsLoop(): void {
  const now = Date.now()
  const delta = (now - lastPhysicsUpdate ) / 1000
  lastPhysicsUpdate = now

  for (let player of Object.values(world.players)) {
    player.acceleration.x = player.moveInput.x * playerInputAcceleration
    player.acceleration.y = player.moveInput.y * playerInputAcceleration
    player.rotation = player.lookRot
  }
  
  for(let body of world.bodies) {
    tickPhysicsBody(body, world, delta)
  }
}

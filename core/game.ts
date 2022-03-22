import { World } from './world'
import { tickPhysicsBody } from './physics'
import { PlayerInputPacket } from './net'
import { Player } from './player'

export const world: World = new World()
export const physicsTickRate = 1000/60
const playerInputAcceleration = 1000
let lastPhysicsUpdate = Date.now()

export function onPlayerJoin(player: Player) {
  world.players[player.id] = player
}

export function onPlayerLeave(id: string) {
  delete world.players[id]
}

export function onPlayerInput(id: string, input: PlayerInputPacket) {
  world.players[id].moveInput = input.moveInput
  world.players[id].lookRot = input.lookRot
}

export function physicsLoop(): void {
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

import { World } from './types'
import { tickPhysicsBody } from '../../core/physics'

export class Game {
  public readonly world: World
  private lastPhysicsUpdate: number

  constructor(tickRateMS: number, private playerInputAcceleration: number) {
    this.world = new World()
    this.lastPhysicsUpdate = Date.now()
    setInterval(() => this.physicsLoop(), tickRateMS)
  }

  public onPlayerJoin(id : string) {
    this.world.players[id] = {
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

  public onPlayerLeave(id) {
    delete this.world.players[id]
  }

  public onPlayerInput(id, input) {
    this.world.players[id].moveInput = input.moveInput
    this.world.players[id].lookRot = input.lookRot
  }

  private physicsLoop(): void {
    const now = Date.now()
    const delta = (now - this.lastPhysicsUpdate ) / 1000
    this.lastPhysicsUpdate = now
  
    for (let player of Object.values(this.world.players)) {
      player.acceleration.x = player.moveInput.x * this.playerInputAcceleration
      player.acceleration.y = player.moveInput.y * this.playerInputAcceleration
      player.rotation = player.lookRot
    }
    
    for(let body of this.world.bodies) {
      tickPhysicsBody(body, this.world, delta)
    }
  }
}

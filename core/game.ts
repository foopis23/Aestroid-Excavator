import { IPlayerInputPacket } from './net'
import { IPlayer } from './player'
import { IPhysicsWorld } from './physics/world'

export class Game {
  public static readonly PHYSICS_TICK_RATE = 1000/60
  public static readonly PLAYER_INPUT_ACCELERATION  = 1000
  
  public world: IPhysicsWorld;
  public players: Record<string, IPlayer>;
  private lastPhysicsUpdate: number;

  constructor(world: IPhysicsWorld) {
    this.world = world
    this.lastPhysicsUpdate = Date.now()
    this.players = {}

    // game loop
    setInterval(() => this.tick(), Game.PHYSICS_TICK_RATE)
  }
  
  public onPlayerJoin(player: IPlayer) {
    this.world.add(player.id, player)
    this.players[player.id] = player
  }

  public onPlayerLeave(id: string) {
    this.world.remove(id)
    delete this.players[id]
  }

  public onPlayerInput(id: string, input: IPlayerInputPacket) {
    const player = this.players[id]
    player.moveInput = input.moveInput
    player.lookRot = input.lookRot
    player.lastInputProcessed = input.id
  }

  public tick() {
    const now = Date.now()
    const delta = (now - this.lastPhysicsUpdate ) / 1000
    this.lastPhysicsUpdate = now
  
    // apply player input
    for (let player of Object.values(this.players)) {
      player.applyInput()
    }
    
    // tick physics bodies
    this.world.tick(delta)
  }
}


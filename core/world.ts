import { PhysicsBody, PhysicsWorld } from './physics'
import { Player } from './player'

export class World implements PhysicsWorld {
  public players: Record<string, Player>
  private _bodies: PhysicsBody[]

  constructor() {
    this.players = {}
    this._bodies = []
  }

  public get bodies(): PhysicsBody[] {
    return [...Object.values(this.players), ...this._bodies]
  }

  public addBody(body: PhysicsBody) {
    this._bodies.push(body)
  }

  public removeBody(body: PhysicsBody) {
    this._bodies = this._bodies.filter((b) => b !== body)
  }
}

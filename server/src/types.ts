import { PhysicsBody, PhysicsWorld } from '../../core/physics'
import { Vector2 } from '../../core/vector2'

export interface Player extends PhysicsBody {
  id: string,
  moveInput: Vector2,
  lookRot: number
}

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

import { IPhysicsBody, IPhysicsWorld } from './physics'
import { IPlayer } from './player'

export class World implements IPhysicsWorld {
  public players: Record<string, IPlayer>
  private _bodies: IPhysicsBody[]

  constructor() {
    this.players = {}
    this._bodies = []
  }

  public get bodies(): IPhysicsBody[] {
    return [...Object.values(this.players), ...this._bodies]
  }

  public addBody(body: IPhysicsBody) {
    this._bodies.push(body)
  }

  public removeBody(body: IPhysicsBody) {
    this._bodies = this._bodies.filter((b) => b !== body)
  }
}

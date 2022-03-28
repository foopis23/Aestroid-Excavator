import { IPhysicsBody } from "./physics/body"
import { IVector2 } from './vector2'

interface IPlayerInput {
  moveInput: IVector2,
  lookRot: number,
  lastInputProcessed: number
}

export abstract class IPlayer implements IPhysicsBody, IPlayerInput {
  public static readonly PLAYER_INPUT_ACCELERATION = 1000
  public lastInputProcessed: number

  constructor(
    public readonly id: string,
    public radius: number,
    public isStatic: boolean = false,
    public position: IVector2 = { x: 0, y: 0 },
    public rotation: number = 0,
    public velocity: IVector2 = { x: 0, y: 0 },
    public acceleration: IVector2 = { x: 0, y: 0 },
    public dragScale: number = 0.8,
    public moveInput: IVector2 = { x: 0, y: 0 },
    public lookRot: number = 0
  ) {
    this.lastInputProcessed = 0
  }

  public applyInput() {
    this.acceleration.x = this.moveInput.x * IPlayer.PLAYER_INPUT_ACCELERATION
    this.acceleration.y = this.moveInput.y * IPlayer.PLAYER_INPUT_ACCELERATION
    this.rotation = this.lookRot
  }

  public onPlayerJoin() {}
  public onPlayerLeave() {}
}

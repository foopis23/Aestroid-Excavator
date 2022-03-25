import { IPlayer } from "../../core/player";
import { IVector2 } from "../../core/vector2";

export class ServerPlayerEntity implements IPlayer {
  lastInputProcessed: number;

  constructor(
    public readonly id: string,
    public radius: number,
    public position: IVector2 = { x: 0, y: 0 },
    public rotation: number = 0,
    public velocity: IVector2 = { x: 0, y: 0 },
    public acceleration: IVector2 = { x: 0, y: 0 },
    public dragScale: number = 0.8,
    public moveInput: IVector2 = { x: 0, y: 0 },
    public lookRot: number = 0,
  ) {
    this.lastInputProcessed = 0
  }
}
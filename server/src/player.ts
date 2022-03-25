import { Player } from "../../core/player";
import { Vector2 } from "../../core/vector2";

export class ServerPlayerEntity implements Player {
  lastInputProcessed: number;

  constructor(
    public readonly id: string,
    public radius: number,
    public position: Vector2 = { x: 0, y: 0 },
    public rotation: number = 0,
    public velocity: Vector2 = { x: 0, y: 0 },
    public acceleration: Vector2 = { x: 0, y: 0 },
    public dragScale: number = 0.8,
    public moveInput: Vector2 = { x: 0, y: 0 },
    public lookRot: number = 0,
  ) {
    this.lastInputProcessed = 0
  }
}
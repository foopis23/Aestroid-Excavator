import { PhysicsBody } from './physics'
import { Vector2 } from './vector2'

interface PlayerInput {
  moveInput: Vector2,
  lookRot: number
}

export interface Player extends PhysicsBody, PlayerInput {
  id: string
}

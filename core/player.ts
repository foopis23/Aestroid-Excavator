import { IPhysicsBody } from './physics'
import { IVector2 } from './vector2'

interface IPlayerInput {
  moveInput: IVector2,
  lookRot: number
}

export interface IPlayer extends IPhysicsBody, IPlayerInput {
  id: string
}

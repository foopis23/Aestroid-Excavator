import { Vector2 } from "../vector2";

export interface Transform {
  id: string,
  isStatic: boolean,
  position: Vector2,
  rotation: number
}

export type TransformSyncData = {
  id: string,
  position: Vector2,
  rotation: number
  timestamp: number
}

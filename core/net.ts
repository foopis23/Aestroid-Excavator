import { Vector2 } from "./vector2"

export interface PlayerInputPacket {
  moveInput: Vector2,
  lookRot: number,
  id: number
}

export interface PlayerSyncData {
  id: string,
  position: Vector2,
  rotation: number,
  lastInputProcessed: number;
}
export interface PlayerSyncPacket {
  players: PlayerSyncData[]
  time: number
}

export interface ServerToClientEvents {
  playerJoin: (id: string) => void,
  playerLeft: (id: string) => void
  playersSync: (data: PlayerSyncPacket) => void
}

export interface ClientToServerEvents {
  playerInput: (input: PlayerInputPacket) => void,
}

export interface InterServerEvents {}

export interface SocketData {}
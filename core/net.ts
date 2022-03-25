import { IVector2 } from "./vector2"

export interface IPlayerInputPacket {
  moveInput: IVector2,
  lookRot: number,
  id: number
}

export interface IPlayerSyncData {
  id: string,
  position: IVector2,
  rotation: number,
  lastInputProcessed: number;
}
export interface IPlayerSyncPacket {
  players: IPlayerSyncData[]
  time: number
}

export interface IServerToClientEvents {
  playerJoin: (id: string) => void,
  playerLeft: (id: string) => void
  playersSync: (data: IPlayerSyncPacket) => void
}

export interface IClientToServerEvents {
  playerInput: (input: IPlayerInputPacket) => void,
}

export interface IInterServerEvents {}

export interface ISocketData {}
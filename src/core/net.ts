import { Vector2 } from "simple-game-math"
import { IEntityData, PlayerInputComponent } from "./components";
import { EntityType } from "./entity";
export interface EntityPacket {
  entityId: number,
  time: number
}

export interface IPlayerInputPacket extends EntityPacket, PlayerInputComponent {}

export interface IPlayerSyncData {
  id: string,
  position: Vector2.IVector2,
  rotation: number,
  lastInputProcessed: number;
}
export interface IPlayerSyncPacket {
  players: IPlayerSyncData[]
  time: number
}

export interface SpawnEntityPacket extends EntityPacket {
  initial?: Partial<IEntityData>
  type: EntityType
}

export interface SyncTransformPacket extends EntityPacket {
  position: Vector2.IVector2,
  rotation: number,
}

export interface IServerToClientEvents {
  start: () => void,
  waiting: () => void,
  full: () => void,
  assignPlayerId: (playerId: number) => void,
  spawnEntity: (data: SpawnEntityPacket) => void,
  despawnEntity: (data: EntityPacket) => void,
  syncTransform: (data: SyncTransformPacket) => void,
}

export interface IClientToServerEvents {
  playerInput: (input: IPlayerInputPacket) => void,
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IInterServerEvents {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ISocketData {}
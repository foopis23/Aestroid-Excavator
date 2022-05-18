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
  type: EntityType,
  otherData?: any
}

export interface SyncTransformPacket extends EntityPacket {
  position: Vector2.IVector2,
  rotation: number,
}

export interface SyncHealthPacket extends EntityPacket {
  health: number
}

export interface SyncInventoryPacket extends EntityPacket {
  materialCount: number
}

export interface SyncTimerPacket extends EntityPacket {
  timerStart: number,
  timerDuration: number
}

export interface IServerToClientEvents {
  // GAME STATES
  WAITING_FOR_PLAYERS: (lookingFor: number) => void,
  INITIALIZE_GAME: () => void,
  START_GAME: () => void,
  END_GAME: () => void,
  FULL_SERVER: () => void,

  // ENTITY EVENTS
  assignPlayerId: (playerId: number) => void,
  spawnEntity: (data: SpawnEntityPacket) => void,
  despawnEntity: (data: EntityPacket) => void,
  syncTransform: (data: SyncTransformPacket) => void,
  syncHealth: (data: SyncHealthPacket) => void
  syncInventory: (data: SyncInventoryPacket) => void,
  syncTimer: (data: SyncTimerPacket) => void,
}

export interface IClientToServerEvents {
  playerInput: (input: IPlayerInputPacket) => void,
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IInterServerEvents {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ISocketData {}
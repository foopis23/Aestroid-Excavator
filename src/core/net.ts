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

export interface IServerToClientEvents {
  playerJoin: (id: string) => void,
  playerLeft: (id: string) => void
  playersSync: (data: IPlayerSyncPacket) => void,
  spawnEntity: (entityId: SpawnEntityPacket) => void,
  despawnEntity: (entityId: EntityPacket) => void,
}

export interface IClientToServerEvents {
  playerInput: (input: IPlayerInputPacket) => void,
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IInterServerEvents {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ISocketData {}
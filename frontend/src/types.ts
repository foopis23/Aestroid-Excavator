import { Socket } from 'socket.io-client';
import { PlayerSyncData } from '../../core/net'
import { ClientToServerEvents, ServerToClientEvents } from '../../core/net';


export interface PlayerUpdateQueueData extends PlayerSyncData {
  time: number
}

export class GameSocket extends Socket<ServerToClientEvents, ClientToServerEvents> {
  public serverTime?: number;
  public clientTime?: number;
  public lastPacketTime?: number;
}
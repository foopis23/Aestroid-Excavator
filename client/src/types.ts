import { Socket } from 'socket.io-client';
import { IPlayerSyncData } from '../../core/net'
import { IClientToServerEvents, IServerToClientEvents } from '../../core/net';


export interface IPlayerUpdateQueueData extends IPlayerSyncData {
  time: number
}

export class GameSocket extends Socket<IServerToClientEvents, IClientToServerEvents> {
  public serverTime?: number;
  public clientTime?: number;
  public lastPacketTime?: number;
}
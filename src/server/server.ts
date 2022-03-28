import { Server, Socket } from "socket.io"
import { Game } from "../core/game"
import { IPlayerInputPacket } from "../core/net";
import { TransformSyncData } from "../core/physics/transform";
import { ServerPlayerEntity } from "./server-player-entity"

export class GameServer {
  public static readonly NETWORK_TICK_RATE = 45
  constructor(protected game: Game, protected serverSocket: Server) {
    // socket events
    serverSocket.on("connection", (socket: Socket) => this.onConnect(socket))

    // loop
    setInterval(() => this.tick(), GameServer.NETWORK_TICK_RATE)
  }

  protected onConnect(socket: Socket): void {
    // setup intial data
    const newPlayer = new ServerPlayerEntity(socket.id, 20);
    this.game.onPlayerJoin(newPlayer)

    // emit initial data
    this.serverSocket.emit('playerJoin', socket.id)

    // handlers
    socket.on('disconnect', () => this.onDisconnect(socket))
    socket.on('playerInput', (input) => this.onPlayerInput(socket, input))
  }

  protected onDisconnect(socket: Socket) {
    this.game.onPlayerLeave(socket.id)
    this.serverSocket.emit('playerLeft', socket.id)
  }

  protected onPlayerInput(socket: Socket, input: IPlayerInputPacket) {
    this.game.onPlayerInput(socket.id, input)
  }

  protected tick(): void {
    const timestamp = Date.now()

    const transformSyncData: TransformSyncData[] = Object.values(this.game.world.bodies)
    .map((body) => {
      return {
        id: body.id,
        position: body.position,
        rotation: body.rotation,
        timestamp: timestamp
      }
    })

    this.serverSocket.emit('transformSync', {
      transformSyncData
    })
  }
}
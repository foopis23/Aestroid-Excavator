import { Server, Socket } from "socket.io";
import { IClientToServerEvents, IInterServerEvents, IServerToClientEvents, ISocketData } from "../core/net";
import { ServerGame } from "./server-game";

enum ServerState {
  LOBBY,
  GAME,
}

export class ServerEngine {
  protected state: ServerState;
  protected playerCount;
  protected game: ServerGame | undefined;
  protected serverSocket: Server;

  constructor(port = 9500, origin = "", protected readonly maxPlayers: number = 2, protected readonly serverTickRate = 1000 / 60) {
    this.state = ServerState.LOBBY
    this.playerCount = 0;
    this.serverSocket = new Server<IClientToServerEvents, IServerToClientEvents, IInterServerEvents, ISocketData>({
      cors: {
        origin: origin,
        methods: ['GET', 'POST']
      }
    })

    this.serverSocket.on('connection', (socket: Socket) => this.onConnect(socket))
    this.serverSocket.listen(port)
    console.log(`Server is listening at ws://localhost:${port}`)
  }

  protected onConnect(socket: Socket) {
    this.playerCount++;

    if (this.playerCount > this.maxPlayers) {
      this.playerCount--;
      socket.emit('FULL_SERVER')
      socket.disconnect()
      return
    }

    socket.on('disconnect', () => this.onDisconnect())
    // socket.on('playerInput', (input: IPlayerInputPacket) => handlePlayerInputPacket(input))

    if (this.playerCount < this.maxPlayers) {
      socket.emit('WAITING_FOR_PLAYERS', this.maxPlayers - this.playerCount)
      return
    }

    if (this.playerCount === this.maxPlayers) {
      this.startGame()
    }
  }

  protected onDisconnect() {
    this.playerCount--;

    if (this.state === ServerState.GAME) {
      if (this.playerCount < this.maxPlayers) {
        this.endGame()
      }
    }
  }

  protected startGame() {
    this.serverSocket.emit('INITIALIZE_GAME')

    this.game = new ServerGame(this.serverSocket, this.serverTickRate)
    this.state = ServerState.GAME

    this.serverSocket.emit('START_GAME')
  }

  protected endGame() {
    if (this.state !== ServerState.GAME) {
      return
    }

    this.serverSocket.emit('END_GAME')
    this.game?.destroy();
    this.game = undefined
    this.state = ServerState.LOBBY
  }
}
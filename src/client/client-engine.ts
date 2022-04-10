import { Application } from "pixi.js"
import { io, Socket } from "socket.io-client"
import { ClientGame } from "./client-game"
import { COLOR_SCHEME } from "./config"
import { useAppScaler } from "./util/window"

enum ClientState {
  INITIALIZING,
  CONNECTING,
  CONNECTED,
  LOBBY,
  GAME,
  DISCONNECTED
}

export class ClientEngine {
  protected readonly socket: Socket
  protected readonly graphics: Application

  protected game: ClientGame | undefined;
  protected state: ClientState;

  constructor(
    protected readonly serverIP: string,
    protected readonly serverPort: number,
    protected readonly serverProtocol: string
  ) {
    this.state = ClientState.INITIALIZING

    // setup graphics system
    this.graphics = new Application({
      width: 1,
      height: 1,
      backgroundColor: COLOR_SCHEME.background
    })
    this.graphics.stage.interactive = true
    useAppScaler(this.graphics)
    document.body.appendChild(this.graphics.view)

    // setup network system
    this.state = ClientState.CONNECTING
    this.socket = io(`${this.serverProtocol}://${this.serverIP}:${this.serverPort}`)

    // handle network events
    this.socket.on('connect', () => this.onConnect())
    this.socket.on('disconnect', () => this.onDisconnect())
    this.socket.on('WAITING_FOR_PLAYERS', (lookingFor: number) => this.onWaitForPlayers(lookingFor))
    this.socket.on('INITIALIZE_GAME', () => this.onInitializeGame())
    this.socket.on('START_GAME', () => this.onStartGame())
    this.socket.on('END_GAME', () => this.onEndGame())
  }

  protected onConnect() {
    this.state = ClientState.CONNECTED
    console.log('Connected to server')
  }

  protected onDisconnect() {
    this.game?.destroy()
    this.game = undefined
    this.state = ClientState.DISCONNECTED
    console.log('Disconnected from server')
  }

  protected onWaitForPlayers(lookingFor: number) {
    this.state = ClientState.LOBBY
    console.log('Waiting for players', lookingFor)
  }

  protected onInitializeGame() {
    this.game = new ClientGame(this.socket, this.graphics)
    console.log('Initializing game')
  }

  protected onStartGame() {
    this.game?.start()
    this.state = ClientState.GAME
    console.log('Starting game')
  }

  protected onEndGame() {
    this.game?.destroy()
    this.game = undefined
    this.state = ClientState.LOBBY
    console.log('Ending game')
  }
}
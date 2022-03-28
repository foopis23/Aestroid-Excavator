// eslint-disable-next-line @typescript-eslint/no-var-requires
require(`dotenv-defaults`).config({
  path: './.env',
  encoding: 'utf8',
  defaults: './.env.defaults' // This is new
})

import { Server } from 'socket.io'
import { 
  IClientToServerEvents,
  IServerToClientEvents,
  IInterServerEvents,
  ISocketData
} from '../core/net'
import { Game } from '../core/game'
import { PhysicsWorld } from '../core/physics/world'
import { GameServer } from './server'

const port: number = (process.env.PORT)? parseInt(process.env.PORT) : 9500
const origin: string = process.env.CORS_URL ?? ""

const io = new Server<IClientToServerEvents, IServerToClientEvents, IInterServerEvents, ISocketData>({
  cors: {
    origin: origin,
    methods: ['GET', 'POST']
  }
})

const game = new Game(new PhysicsWorld())
new GameServer(game, io)

io.listen(port)
console.log(`Server is listening at ws://localhost:${port}`)
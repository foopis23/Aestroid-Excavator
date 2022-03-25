// eslint-disable-next-line @typescript-eslint/no-var-requires
require(`dotenv-defaults`).config({
  path: './.env',
  encoding: 'utf8',
  defaults: './.env.defaults' // This is new
})

import { Socket, Server } from 'socket.io'
import { 
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData, 
  PlayerSyncData
} from '../../core/net'
import { onPlayerInput, onPlayerJoin, onPlayerLeave, physicsLoop, world, physicsTickRate } from '../../core/game'
import { ServerPlayerEntity } from './player'

const port: number = (process.env.PORT)? parseInt(process.env.PORT) : 9500
const origin: string = process.env.CORS_URL
const networkTickRate = 45

const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>({
  cors: {
    origin: origin,
    methods: ['GET', 'POST']
  }
})

// Setup Web Socket
io.on("connection", (socket: Socket) => {
  // setup intial data
  const newPlayer = new ServerPlayerEntity(socket.id, 20);

  onPlayerJoin(newPlayer)

  // emit initial data
  io.emit('playerJoin', socket.id)

  // handle disconnect
  socket.on('disconnect', () => {
    onPlayerLeave(socket.id)
    io.emit('playerLeft', socket.id)
  })

  // handle input
  socket.on('playerInput', (input) => {
    onPlayerInput(socket.id, input)
  })
})

// Network Sync Loop
const clientUpdateLoop = () => {
  const players : PlayerSyncData[] = Object.values(world.players)
    .map((player) => {
      return {
        id: player.id,
        position: player.position,
        rotation: player.rotation,
        lastInputProcessed: (player as ServerPlayerEntity).lastInputProcessed
      }
    })

  io.emit('playersSync', {
    players,
    time: Date.now()
  })
}
setInterval(clientUpdateLoop, networkTickRate)
setInterval(physicsLoop, physicsTickRate)


io.listen(port)
console.log(`Server is listening at ws://localhost:${port}`)
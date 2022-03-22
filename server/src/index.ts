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
  onPlayerJoin({
    id: socket.id,
    position: {x: 0, y: 0},
    velocity: {x: 0, y: 0},
    acceleration: {x: 0, y: 0},
    rotation: 0,
    radius: 20,
    moveInput: {x: 0, y: 0},
    lookRot: 0,
    dragScale: 0.8
  })

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
        rotation: player.rotation
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
import { Socket, Server } from 'socket.io'
import { 
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData, 
  PlayerSyncData
} from '../../core/net'
import { onPlayerInput, onPlayerJoin, onPlayerLeave, world } from '../../core/game'

const port = 3001
const networkTickRate = 45

const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>({
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
})

// Setup Web Socket
io.on("connection", (socket: Socket) => {
  // setup intial data
  onPlayerJoin(socket.id)

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


io.listen(port)
console.log(`Server is listening at ws://localhost:${3001}`)
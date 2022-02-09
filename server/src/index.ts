import { Socket, Server } from 'socket.io'
import { Game } from './game'

const playerInputAcceleration = 1000
const physicsTickRate = 1000/60
const networkTickRate = 45

const game = new Game(physicsTickRate, playerInputAcceleration)

const io = new Server({
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
})

// Setup Web Socket
io.on("connection", (socket: Socket) => {
  // setup intial data
  game.onPlayerJoin(socket.id)

  // emit initial data
  io.emit('playerJoin', socket.id)

  // handle disconnect
  socket.on('disconnect', () => {
    game.onPlayerLeave(socket.id)
    io.emit('playerLeft', socket.id)
  })

  // handle input
  socket.on('playerInput', (input) => {
    game.onPlayerInput(socket.id, input)
  })
})

// Network Sync Loop
const clientUpdateLoop = () => {
  io.emit('playersSync', {
    players: Object.values(game.world.players).map((player) => {return {id: player.id, position: player.position, rotation: player.rotation}}),
    time: Date.now()
  })
}
setInterval(clientUpdateLoop, networkTickRate)


io.listen(3001)
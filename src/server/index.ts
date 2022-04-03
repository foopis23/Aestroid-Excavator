// eslint-disable-next-line @typescript-eslint/no-var-requires
require(`dotenv-defaults`).config({
  path: './.env',
  encoding: 'utf8',
  defaults: './.env.defaults' // This is new
})

import { Server, Socket } from 'socket.io'
import {
  IClientToServerEvents,
  IServerToClientEvents,
  IInterServerEvents,
  ISocketData,
  IPlayerInputPacket
} from '../core/net'

import { ECS } from '../core/ecs'
import { CollisionSystem, PhysicsSystem, PlayerInputHandlerSystem } from '../core/systems'
import { ComponentTypes, IEntityData } from '../core/components'
import { TransformSyncSystem } from './transform-sync'
import { EntityType } from '../core/entity'

const SERVER_TICK_RATE = 1000 / 60

// setup server socket
const port: number = (process.env.PORT) ? parseInt(process.env.PORT) : 9500
const origin: string = process.env.CORS_URL ?? ""
const serverSocket = new Server<IClientToServerEvents, IServerToClientEvents, IInterServerEvents, ISocketData>({
  cors: {
    origin: origin,
    methods: ['GET', 'POST']
  }
})

// setup ecs
const ecs = new ECS(
  PhysicsSystem,
  CollisionSystem,
  PlayerInputHandlerSystem,
  new TransformSyncSystem(serverSocket)
);

// create map of socket id to player entity id
const socketIdToPlayerEntityId = new Map<string, number>()

serverSocket.on("connection", (socket: Socket) => onConnect(socket))

function onConnect(socket: Socket): void {
  // setup intial data
  const initialPlayerValues: Partial<IEntityData> = {
    static: false,
    type: 'circle',
    maxAcceleration: 1000,
    size: { x: 20, y: 20 },
    position: { x: Math.random() * 1340 + 100, y: Math.random() * 980 + 100 },
    priority: 20
  }

  const player = ecs.createNewEntity(
    EntityType.Player,
    initialPlayerValues,
    [
      ComponentTypes.Transform,
      ComponentTypes.PlayerInput,
      ComponentTypes.Collider,
      ComponentTypes.RigidBody
    ]
  )

  socketIdToPlayerEntityId.set(socket.id, player.id)
  socket.emit('playerId', player.id)

  for (const entity of ecs.entities) {
    if (entity) {
      console.log("spawnEntity", entity.id)
      const entityData = ecs.entityData[entity.id]
      socket.emit('spawnEntity', {
        entityId: entity.id,
        time: Date.now(),
        initial: entityData ?? {},
        type: entity.type
      })
    }
  }

  socket.on('disconnect', () => onDisconnect(socket))
  socket.on('playerInput', (input: IPlayerInputPacket) => handlePlayerInputPacket(input))

  // emit initial data
  serverSocket.emit('spawnEntity', {
    entityId: player.id,
    type: EntityType.Player,
    time: Date.now(),
    initial: initialPlayerValues
  })
}

function onDisconnect(socket: Socket) {
  const playerId = socketIdToPlayerEntityId.get(socket.id)
  if (playerId === undefined) {
    return
  }
  serverSocket.emit('despawnEntity', { entityId: playerId, time: Date.now() })
  ecs.destroyEntityById(playerId)
  socketIdToPlayerEntityId.delete(socket.id)
}

function handlePlayerInputPacket(inputPacket: IPlayerInputPacket) {
  const entity = ecs.entities[inputPacket.entityId]
  if (entity === undefined || entity === null) {
    return
  }

  const inputData = ecs.getComponent<IPlayerInputPacket>(entity, ComponentTypes.PlayerInput)
  if (!inputData) {
    return
  }
  inputData.moveInput = inputPacket.moveInput
  inputData.lookRot = inputPacket.lookRot
}

let lastTick: number = Date.now();
function tick() {
  const now = Date.now()
  const dt = now - lastTick / 1000
  lastTick = now
  ecs.update(dt)
}

serverSocket.listen(port)
console.log(`Server is listening at ws://localhost:${port}`)

setInterval(() => tick(), SERVER_TICK_RATE)

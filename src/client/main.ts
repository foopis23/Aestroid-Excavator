import './style.css'

import { COLOR_SCHEME, BASE_RESOLUTION } from './config'

import { Application, settings } from 'pixi.js'
import { ECS } from '../core/ecs'
import { BoundsSystem, CollisionSystem, PhysicsSystem, PlayerInputHandlerSystem } from '../core/systems'

import { ComponentTypes, GraphicsComponent, TransformSyncComponent } from '../core/components'
import { ClientPredictionSystem, GraphicsSystem, PollInputSystem, SyncInputSystem, TransformSmoothingSystem } from './systems'
import { createPlayer } from './entities/player'
import { useAppScaler } from './window'
import { io } from 'socket.io-client'
import { EntityPacket, SpawnEntityPacket, SyncTransformPacket } from '../core/net'
import { EntityType } from '../core/entity'
import { createAsteroid } from './entities/asteroid'

const TARGET_FPMS = settings.TARGET_FPMS ?? 0.06

const app = new Application({
  width: 1,
  height: 1,
  backgroundColor: COLOR_SCHEME.background
})
app.stage.interactive = true
useAppScaler(app)
document.body.appendChild(app.view)

const socket = io('ws://localhost:9500')
let localPlayerId: number | undefined = undefined;

const ecs = new ECS(
  new PollInputSystem(app),
  new SyncInputSystem(1 / 30, socket),
  new PlayerInputHandlerSystem(),
  new PhysicsSystem(),
  new CollisionSystem(),
  new BoundsSystem({ x: 0, y: 0, w: BASE_RESOLUTION.x, h: BASE_RESOLUTION.y }),
  new TransformSmoothingSystem(200),
  new ClientPredictionSystem(),
  new GraphicsSystem()
)

socket.on('waiting', () => {
  // add some code here
})

socket.on('disconnect', () => {
  app.stage.removeChildren()
  localPlayerId = undefined
})

socket.on('start', () => {
  app.ticker.add((deltaFrame: number) => {
    const delta = (deltaFrame / TARGET_FPMS) / 1000
    ecs.update(delta)
  })
})

socket.on('assignPlayerId', (playerId) => {
  console.log('Received Player ID', playerId)
  localPlayerId = playerId
})

socket.on('spawnEntity', (data: SpawnEntityPacket) => {
  console.log('Spawning Entity', data.entityId)

  if (!ecs.isEntityIdFree(data.entityId)) {
    return
  }

  switch (data.type) {
    case EntityType.Player:
      createPlayer(
        app,
        ecs,
        localPlayerId == data.entityId,
        data.initial ?? {},
        (localPlayerId == data.entityId) ? COLOR_SCHEME.team1 : COLOR_SCHEME.team2
      )
      break;
    case EntityType.Asteroid:
      createAsteroid(app, ecs, data.initial ?? {})
      break;
    default:
      throw new Error("Unknown Entity Type From Server")
  }
})

socket.on('despawnEntity', (data: EntityPacket) => {
  console.log('Despawning Entity', data.entityId)
  const entity = ecs.entities[data.entityId]
  if (entity) {
    // TODO: Maybe find a better way to integrate graphics into this system
    const graphics = ecs.getComponent<GraphicsComponent>(entity, ComponentTypes.Graphics)
    if (graphics && graphics.graphics) {
      app.stage.removeChild(graphics.graphics)
    }
    ecs.destroyEntityById(data.entityId)
  }
})

socket.on('syncTransform', (data: SyncTransformPacket) => {
  const entity = ecs.entities[data.entityId]
  if (entity) {
    const transformSync = ecs.getComponent<TransformSyncComponent>(entity, ComponentTypes.TransformSync)
    if (transformSync) {
      transformSync.transformBuffer.push({
        time: data.time,
        value: {
          position: data.position,
          rotation: data.rotation,
        }
      })
    }
  }
})

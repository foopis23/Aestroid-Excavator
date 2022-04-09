import { Server, Socket } from "socket.io";
import { ComponentTypes, IEntityData, PlayerInputComponent } from "../core/components";
import { ECS } from "../core/ecs";
import { EntityType, IEntity } from "../core/entity";
import { IClientToServerEvents, IInterServerEvents, IPlayerInputPacket, IServerToClientEvents, ISocketData } from "../core/net";
import { BoundsSystem, CollisionSystem, PhysicsSystem, PlayerInputHandlerSystem, TriggerSystem } from "../core/systems";
import { HealthSystem, PlayerLaserSpawnSystem, SyncHealthSystem } from "./systems";
import { TransformSyncSystem } from "./transform-sync";

export class ServerGame {
  protected ecs: ECS;
  protected socketIdToPlayerEntityId: Map<string, number>;
  protected lastTick: number;

  private intervalHandle: NodeJS.Timer;

  constructor(
    protected serverSocket: Server<IClientToServerEvents, IServerToClientEvents, IInterServerEvents, ISocketData>,
    SERVER_TICK_RATE: number
  ) {
    this.ecs = new ECS(
      new PlayerInputHandlerSystem(),
      new PlayerLaserSpawnSystem(serverSocket),
      new PhysicsSystem(),
      new CollisionSystem(),
      new TriggerSystem(serverSocket),
      new TransformSyncSystem(1 / 30, serverSocket),
      // TODO: hook up with configurable map size
      new BoundsSystem({ x: 0, y: 0, w: 1440, h: 1080 }),
      new HealthSystem(serverSocket),
      new SyncHealthSystem(1/10, serverSocket)
    );
    this.socketIdToPlayerEntityId = new Map<string, number>();



    for (const socketEntry of this.serverSocket.sockets.sockets) {
      const socket = socketEntry[1]
      socket.on('playerInput', (input: IPlayerInputPacket) => this.onPlayerInput(socket, input))
      this.spawnServerPlayerEntity(socket)
    }

    for (let i = 0; i < 10; i++) {
      this.spawnAsteroidServerEntity()
    }

    this.lastTick = Date.now();
    this.intervalHandle = setInterval(() => this.tick(), SERVER_TICK_RATE)
  }

  protected spawnAsteroidServerEntity(): IEntity {
    const radius = (Math.random() * 60) + 20

    const points = []
    const numPoints = Math.random() * 6 + 4

    for (let p = 0; p < numPoints; p++) {
      const angle = p * Math.PI * 2 / numPoints
      const distance = (Math.random() * (radius - (radius * 0.5))) + (radius * 0.5)
      points.push({ x: Math.cos(angle) * distance, y: Math.sin(angle) * distance })
    }

    const initialData: Partial<IEntityData> = {
      // TODO: Configurable Map Size
      position: { x: Math.random() * 1440, y: Math.random() * 1080 },
      static: false,
      maxAcceleration: 1000,
      size: { x: radius, y: radius },
      hasDrag: false,
      velocity: { x: Math.random() * 20 - 10, y: Math.random() * 20 - 10 },
      type: 'circle',
      priority: radius,
      health: radius,
      maxHealth: radius
    }

    const entity = this.ecs.createNewEntity(
      EntityType.Asteroid,
      initialData,
      [
        ComponentTypes.Transform,
        ComponentTypes.RigidBody,
        ComponentTypes.Collider,
        ComponentTypes.TransformSync,
        ComponentTypes.Health
      ]
    )

    this.serverSocket.emit('spawnEntity', {
      entityId: entity.id,
      type: EntityType.Asteroid,
      time: Date.now(),
      initial: initialData,
      otherData: {
        points: points
      }
    })

    return entity
  }

  protected spawnServerPlayerEntity(socket: Socket): IEntity {
    const initialPlayerValues: Partial<IEntityData> = {
      static: false,
      type: 'circle',
      maxAcceleration: 1000,
      size: { x: 20, y: 20 },
      position: { x: Math.random() * 1340 + 100, y: Math.random() * 980 + 100 },
      priority: 20,
      fireRate: 500,
      lastFireTime: 0
    }

    const player = this.ecs.createNewEntity(
      EntityType.Player,
      initialPlayerValues,
      [
        ComponentTypes.Transform,
        ComponentTypes.PlayerInput,
        ComponentTypes.Collider,
        ComponentTypes.RigidBody,
        ComponentTypes.LaserSpawn
      ]
    );

    socket.emit('assignPlayerId', player.id)

    // emit initial data
    this.serverSocket.emit('spawnEntity', {
      entityId: player.id,
      type: EntityType.Player,
      time: Date.now(),
      initial: initialPlayerValues
    })

    this.socketIdToPlayerEntityId.set(socket.id, player.id)

    return player
  }

  protected tick() {
    const now = Date.now()
    const dt = (now - this.lastTick) / 1000
    this.lastTick = now
    this.ecs.update(dt)
  }

  protected onPlayerInput(socket: Socket, input: IPlayerInputPacket) {
    const playerEntityId = this.socketIdToPlayerEntityId.get(socket.id)

    if (playerEntityId !== undefined) {
      const playerEntity = this.ecs.entities[playerEntityId]
      if (playerEntity) {
        const playerInput = this.ecs.getComponent<PlayerInputComponent>(playerEntity, ComponentTypes.PlayerInput)

        if (playerInput) {
          playerInput.moveInput = input.moveInput
          playerInput.lookRot = input.lookRot
          playerInput.isFire = input.isFire
        }
      }
    }
  }

  public destroy() {
    clearInterval(this.intervalHandle)

    const sockets = this.serverSocket.sockets.sockets;
    for (const socket of sockets.values()) {
      socket.removeAllListeners('playerInput')
    }
  }
}
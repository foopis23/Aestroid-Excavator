import { Server } from "socket.io";
import { ComponentTypes, HealthComponent, IEntityData, LaserSpawnerComponent, PlayerInputComponent, TransformComponent } from "../core/components";
import { IECS } from "../core/ecs";
import { EntityType, IEntity } from "../core/entity";
import { IClientToServerEvents, IInterServerEvents, IServerToClientEvents, ISocketData } from "../core/net";
import { AbstractNetworkSyncSystem, AbstractSimpleSystem } from "../core/systems";

export class PlayerLaserSpawnSystem extends AbstractSimpleSystem {

  constructor(protected readonly serverSocket: Server<IClientToServerEvents, IServerToClientEvents, IInterServerEvents, ISocketData>) {
    super()
  }

  update(ecs: IECS, _dt: number, entity: IEntity): void {
    const transform = ecs.getComponent<TransformComponent>(entity, ComponentTypes.Transform)
    const playerInput = ecs.getComponent<PlayerInputComponent>(entity, ComponentTypes.PlayerInput)
    const laserSpawn = ecs.getComponent<LaserSpawnerComponent>(entity, ComponentTypes.LaserSpawn);

    if (!transform || !playerInput || !laserSpawn) {
      return
    }

    if (playerInput.isFire && laserSpawn.lastFireTime + laserSpawn.fireRate < Date.now()) {
      laserSpawn.lastFireTime = Date.now()
      const initial: Partial<IEntityData> = {
        position: {
          x: transform.position.x + Math.cos(transform.rotation) * (11 + 30),
          y: transform.position.y + Math.sin(transform.rotation) * (11 + 30),
        },
        rotation: transform.rotation + Math.PI / 2,
        triggerShape: 'circle',
        triggerSize: {x: 5, y: 30},
        velocity: {
          x: Math.cos(transform.rotation) * 1000,
          y: Math.sin(transform.rotation) * 1000,
        },
        hasDrag: false
      }

      const laser = ecs.createNewEntity(
        EntityType.Projectile,
        initial,
        [
          ComponentTypes.Transform,
          ComponentTypes.RigidBody,
          ComponentTypes.TriggerCollider
        ]
      )

      this.serverSocket.emit('spawnEntity', {
        entityId: laser.id,
        type: EntityType.Projectile,
        initial,
        time: Date.now()
      })
    }
  }
}

export class HealthSystem extends AbstractSimpleSystem {

  constructor(protected readonly serverSocket: Server<IClientToServerEvents, IServerToClientEvents, IInterServerEvents, ISocketData>) {
    super()
  }

  update(ecs: IECS, _dt: number, entity: IEntity): void {
    const health = ecs.getComponent<HealthComponent>(entity, ComponentTypes.Health)
    if (!health) {
      return
    }

    // TODO: if asteroid, spawn new asteroid
    // TODO: if asteroid, spawn materials
    // TODO: if player, drop inventory
    if (health.health <= 0) {
      ecs.destroyEntity(entity)
      this.serverSocket.emit('despawnEntity', {
        entityId: entity.id,
        time: Date.now()
      })
    }
  }
}

export class SyncHealthSystem extends AbstractNetworkSyncSystem {
  constructor(syncRate: number, private serverSocket: Server) {
    super(syncRate)
  }

  sync(ecs: IECS, entity: IEntity): void {
    const health = ecs.getComponent<HealthComponent>(entity, ComponentTypes.Health)
    if (!health) {
      return
    }

    this.serverSocket.emit('syncHealth', {
      entityId: entity.id,
      health: health.health,
      time: Date.now()
    })
  }
}
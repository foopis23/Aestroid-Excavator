import { Server } from "socket.io";
import { ColliderComponent, ComponentTypes, HealthComponent, IEntityData, InventoryComponent, LaserSpawnerComponent, LifetimeComponent, PlayerInputComponent, TransformComponent } from "../core/components";
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
          // TODO: remove hardcoded values
          x: transform.position.x + Math.cos(transform.rotation) * (11 + 30),
          y: transform.position.y + Math.sin(transform.rotation) * (11 + 30),
        },
        rotation: transform.rotation + Math.PI / 2,
        triggerShape: 'circle',
        triggerSize: { x: 5, y: 30 },
        velocity: {
          // TODO: remove hardcoded values
          x: Math.cos(transform.rotation) * 1000,
          y: Math.sin(transform.rotation) * 1000,
        },
        hasDrag: false,
        lifetime: 2000,
        spawnTime: Date.now(),
      }

      const laser = ecs.createNewEntity(
        EntityType.Projectile,
        initial,
        [
          ComponentTypes.Transform,
          ComponentTypes.RigidBody,
          ComponentTypes.TriggerCollider,
          ComponentTypes.Lifetime
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

    if (health.health <= 0) {

      switch (entity.type) {
        case EntityType.Player:
          // TODO: if player, drop inventory
          break;
        case EntityType.Asteroid:
          // TODO: if asteroid, spawn new asteroid
          {
            const asteroidTransform = ecs.getComponent<TransformComponent>(entity, ComponentTypes.Transform)
            const asteroidCollider = ecs.getComponent<ColliderComponent>(entity, ComponentTypes.Collider)

            if (!asteroidTransform || !asteroidCollider) {
              break
            }

            const materialCount = Math.max(Math.floor((asteroidCollider.size.x - 20 ) / 10), 1)

            for (let i = 0; i < materialCount; i++) {
              const materialPartial: Partial<IEntityData> = {
                position: {
                  x: asteroidTransform.position.x,
                  y: asteroidTransform.position.y,
                },
                velocity: {
                  x: (Math.random() * 10 * materialCount) - 5 * materialCount,
                  y: (Math.random() * 10 * materialCount) - 5 * materialCount
                },
                hasDrag: true,
                triggerShape: 'circle',
                triggerSize: { x: 5, y: 5 },
              }
  
              const material = ecs.createNewEntity(
                EntityType.Material,
                materialPartial,
                [
                  ComponentTypes.Transform,
                  ComponentTypes.TriggerCollider,
                  ComponentTypes.RigidBody
                ]
              )
  
              this.serverSocket.emit('spawnEntity', {
                entityId: material.id,
                type: EntityType.Material,
                initial: materialPartial,
                time: Date.now()
              })
            }
          }

          break;
        default:
          break;
      }

      ecs.destroyEntity(entity)
      this.serverSocket.emit('despawnEntity', {
        entityId: entity.id,
        time: Date.now()
      })
    }
  }
}

export class SyncHealthSystem extends AbstractNetworkSyncSystem {
  constructor(syncRate: number, private serverSocket: Server<IClientToServerEvents, IServerToClientEvents, IInterServerEvents, ISocketData>) {
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

export class SyncInventorySystem extends AbstractNetworkSyncSystem {
  constructor(syncRate: number, private serverSocket: Server<IClientToServerEvents, IServerToClientEvents, IInterServerEvents, ISocketData>) {
    super(syncRate)
  }

  sync(ecs: IECS, entity: IEntity): void {
    const inventory = ecs.getComponent<InventoryComponent>(entity, ComponentTypes.PlayerInput)
    if (!inventory) {
      return
    }

    this.serverSocket.emit('syncInventory', {
      entityId: entity.id,
      materialCount: inventory.materialCount,
      time: Date.now()
    })
  }
}

export class LifetimeSystem extends AbstractSimpleSystem {
  constructor(private serverSocket: Server<IClientToServerEvents, IServerToClientEvents, IInterServerEvents, ISocketData>) {
    super()
  }

  update(ecs: IECS, _dt: number, entity: IEntity): void {
    const lifetime = ecs.getComponent<LifetimeComponent>(entity, ComponentTypes.Lifetime)
    if (!lifetime) {
      return
    }

    if (Date.now() - lifetime.spawnTime > lifetime.lifetime) {
      ecs.destroyEntity(entity)
      this.serverSocket.emit('despawnEntity', {
        entityId: entity.id,
        time: Date.now()
      })
    }
  }
}
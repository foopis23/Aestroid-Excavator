import { Vector2 } from "simple-game-math";
import { collisions, kinematics } from "simple-game-physics";
import { Server } from "socket.io";
import { ColliderComponent, ComponentTypes, HealthComponent, IEntityData, InventoryComponent, LocalPlayerComponent, PlayerInputComponent, RigidBodyComponent, TransformComponent, TransformSyncComponent, TriggerColliderComponent } from "./components";
import { IECS } from "./ecs";
import { EntityType, IEntity } from "./entity";
import { IClientToServerEvents, IInterServerEvents, IServerToClientEvents, ISocketData } from "./net";

const {
  resolveCircleVsRectangleCollision,
  resolveRectangleVsCircleCollision,
  resolveCircleVsCircleCollision,
  isCircleVsCircleCollision,
  isCircleVsRectangleCollision
} = collisions

const {
  applyAcceleration,
  applyDrag,
  applyVelocity
} = kinematics

export interface ISystem {
  preUpdate(ecs: IECS, dt: number): void;
  update(ecs: IECS, dt: number, entity: IEntity): void;
  postUpdate(ecs: IECS, dt: number): void;
}

export abstract class AbstractSimpleSystem implements ISystem {
  abstract update(ecs: IECS, dt: number, entity: IEntity): void
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  postUpdate(): void { }
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  preUpdate(): void { }
}

export abstract class AbstractNetworkSyncSystem implements ISystem {
  protected timeSinceLastSync: number;
  constructor(protected syncDelta: number) {
    this.timeSinceLastSync = 0
  }

  preUpdate(_ecs: IECS, dt: number): void {
    this.timeSinceLastSync += dt
  }
  update(ecs: IECS, _dt: number, entity: IEntity): void {
    if (this.timeSinceLastSync < this.syncDelta) {
      return
    }

    this.sync(ecs, entity)
  }

  abstract sync(ecs: IECS, entity: IEntity): void;

  postUpdate(): void {
    if (this.timeSinceLastSync < this.syncDelta) {
      return
    }

    this.timeSinceLastSync = 0
  }

}

export function doPhysicsLoop(ecs: IECS, dt: number, entity: IEntity) {
  const transform = ecs.getComponent<TransformComponent>(entity, ComponentTypes.Transform)
  const rigidBody = ecs.getComponent<RigidBodyComponent>(entity, ComponentTypes.RigidBody)

  if (rigidBody && transform) {
    // if in browser and not local player, don't apply physics
    if (typeof process !== 'object') {
      const transformSync = ecs.getComponent<TransformSyncComponent>(entity, ComponentTypes.TransformSync);
      if (transformSync) {
        const localPlayer = ecs.getComponent<LocalPlayerComponent>(entity, ComponentTypes.LocalPlayer)
        if (!localPlayer || !localPlayer.isLocalPlayer) {
          return
        }
      }
    }

    rigidBody.velocity = applyAcceleration(rigidBody.velocity, rigidBody.acceleration, dt)
    if (rigidBody.hasDrag) {
      rigidBody.velocity = applyDrag(rigidBody.velocity, 150, dt)
    }
    transform.position = applyVelocity(transform.position, rigidBody.velocity, dt)
  }
}

export class PhysicsSystem extends AbstractSimpleSystem {
  update(ecs: IECS, dt: number, entity: IEntity): void {
    doPhysicsLoop(ecs, dt, entity)
  }
}

export function doCollisionLoop(ecs: IECS, entity: IEntity) {
  const transform = ecs.getComponent<TransformComponent>(entity, ComponentTypes.Transform)
  const collider = ecs.getComponent<ColliderComponent>(entity, ComponentTypes.Collider)

  // if in browser and not local player, don't apply collisions
  if (typeof process !== 'object') {
    const localPlayer = ecs.getComponent<LocalPlayerComponent>(entity, ComponentTypes.LocalPlayer)
    if (!localPlayer || !localPlayer.isLocalPlayer) {
      return
    }
  }

  if (!collider || !transform) {
    return
  }

  if (collider.static) {
    return
  }

  for (const otherEntity of ecs.entities) {
    if (otherEntity === null) {
      continue
    }

    if (otherEntity.id === entity.id) {
      continue
    }

    const otherTransform = ecs.getComponent<TransformComponent>(otherEntity, ComponentTypes.Transform)
    const otherCollider = ecs.getComponent<ColliderComponent>(otherEntity, ComponentTypes.Collider)

    if (!otherTransform || !otherCollider) {
      continue
    }

    if (otherCollider.priority < collider.priority) {
      continue
    }

    if (
      collider.type === 'circle'
      && otherCollider.type === 'circle'
      && isCircleVsCircleCollision(
        transform.position,
        otherTransform.position,
        collider.size.x,
        otherCollider.size.x
      )
    ) {
      transform.position = resolveCircleVsCircleCollision(
        transform.position,
        otherTransform.position,
        collider.size.x,
        otherCollider.size.x
      )
      continue
    }

    if (
      collider.type === 'circle'
      && otherCollider.type === 'rectangle'
      && isCircleVsRectangleCollision(
        transform.position,
        collider.size.x,
        otherTransform.position,
        otherCollider.size
      )
    ) {
      transform.position = resolveCircleVsRectangleCollision(
        transform.position,
        collider.size.x,
        otherTransform.position,
        otherCollider.size
      )
      continue
    }

    if (
      collider.type === 'rectangle'
      && otherCollider.type === 'circle'
      && isCircleVsRectangleCollision(
        transform.position,
        collider.size.x,
        otherTransform.position,
        otherCollider.size
      )
    ) {
      otherTransform.position = resolveRectangleVsCircleCollision(
        otherTransform.position,
        otherCollider.size,
        transform.position,
        collider.size.x
      )
      continue
    }
  }
}

export class CollisionSystem extends AbstractSimpleSystem {
  update(ecs: IECS, _dt: number, entity: IEntity): void {
    doCollisionLoop(ecs, entity)
  }
}

export function doPlayerInputHandleLoop(ecs: IECS, entity: IEntity) {
  const playerInput = ecs.getComponent<PlayerInputComponent>(entity, ComponentTypes.PlayerInput)
  const rigidBody = ecs.getComponent<RigidBodyComponent>(entity, ComponentTypes.RigidBody)
  const transform = ecs.getComponent<TransformComponent>(entity, ComponentTypes.Transform)

  if (playerInput && rigidBody && transform) {

    // if we're in the browser, only handle input if we're the local player
    if (typeof process !== 'object') {
      const localPlayer = ecs.getComponent<LocalPlayerComponent>(entity, ComponentTypes.LocalPlayer)
      if (!localPlayer || !localPlayer.isLocalPlayer) {
        return
      }
    }

    rigidBody.acceleration.x = playerInput.moveInput.x * rigidBody.maxAcceleration
    rigidBody.acceleration.y = playerInput.moveInput.y * rigidBody.maxAcceleration
    transform.rotation = playerInput.lookRot
  }
}

export class PlayerInputHandlerSystem extends AbstractSimpleSystem {
  update(ecs: IECS, _dt: number, entity: IEntity): void {
    doPlayerInputHandleLoop(ecs, entity)
  }
}

export class BoundsSystem extends AbstractSimpleSystem {
  constructor(private bounds: { x: number, y: number, w: number, h: number }) {
    super();
  }

  update(ecs: IECS, _dt: number, entity: IEntity): void {
    const transform = ecs.getComponent<TransformComponent>(entity, ComponentTypes.Transform)

    // if in browser and not local player, don't apply bounds
    if (typeof process !== 'object') {
      const transformSync = ecs.getComponent<TransformSyncComponent>(entity, ComponentTypes.TransformSync);
      if (transformSync) {
        const localPlayer = ecs.getComponent<LocalPlayerComponent>(entity, ComponentTypes.LocalPlayer)
        if (!localPlayer || !localPlayer.isLocalPlayer) {
          return
        }
      }
    }

    if (transform) {
      if (transform.position.x < this.bounds.x) {
        transform.position.x = this.bounds.x + this.bounds.w
      }
      if (transform.position.x > this.bounds.x + this.bounds.w) {
        transform.position.x = this.bounds.x
      }
      if (transform.position.y < this.bounds.y) {
        transform.position.y = this.bounds.y + this.bounds.h
      }
      if (transform.position.y > this.bounds.y + this.bounds.h) {
        transform.position.y = this.bounds.y
      }
    }
  }
}

// TODO: Add support for trigger v trigger collision
// TODO: Move this to server systems since it doesn't need to be updated on the client
export class TriggerSystem extends AbstractSimpleSystem {
  constructor(protected readonly serverSocket: Server<IClientToServerEvents, IServerToClientEvents, IInterServerEvents, ISocketData>) {
    super()
  }

  update(ecs: IECS, _dt: number, entity: IEntity): void {
    const transform = ecs.getComponent<TransformComponent>(entity, ComponentTypes.Transform)
    const collider = ecs.getComponent<TriggerColliderComponent>(entity, ComponentTypes.TriggerCollider)

    if (transform === undefined || collider === undefined) {
      return
    }

    for (const otherEntity of ecs.entities) {
      if (otherEntity === null) {
        continue
      }

      if (otherEntity.id === entity.id) {
        continue
      }

      const otherTransform = ecs.getComponent<TransformComponent>(otherEntity, ComponentTypes.Transform)
      const otherCollider = ecs.getComponent<ColliderComponent>(otherEntity, ComponentTypes.Collider)

      if (!otherTransform || !otherCollider) {
        continue
      }

      if (
        collider.triggerShape === 'circle'
        && otherCollider.type === 'circle'
        && isCircleVsCircleCollision(
          transform.position,
          otherTransform.position,
          collider.triggerSize.x,
          otherCollider.size.x
        )
      ) {
        this.handleTrigger(ecs, entity, otherEntity)
        continue
      }

      if (
        collider.triggerShape === 'circle'
        && otherCollider.type === 'rectangle'
        && isCircleVsRectangleCollision(
          transform.position,
          collider.triggerSize.x,
          otherTransform.position,
          otherCollider.size
        )
      ) {
        this.handleTrigger(ecs, entity, otherEntity)
        continue
      }

      // todo: this hack doesn't work here
      if (
        collider.triggerShape === 'rectangle'
        && otherCollider.type === 'circle'
        && isCircleVsRectangleCollision(
          otherTransform.position,
          otherCollider.size.x,
          transform.position,
          collider.triggerSize
        )
      ) {
        this.handleTrigger(ecs, entity, otherEntity)
        continue
      }
    }
  }

  private handleTrigger(ecs: IECS, entity: IEntity, otherEntity: IEntity) {
    switch (entity.type) {
      case EntityType.Material:
        {
          const otherInventory = ecs.getComponent<InventoryComponent>(otherEntity, ComponentTypes.Inventory)
          if (otherInventory) {
            otherInventory.materialCount++;
            this.serverSocket.emit('despawnEntity', { entityId: entity.id, time: Date.now() })
            ecs.destroyEntity(entity)
          }
        }

        break;
      case EntityType.Goal:
        break;
      case EntityType.Projectile:
        {
          const health = ecs.getComponent<HealthComponent>(otherEntity, ComponentTypes.Health)
          const inventory = ecs.getComponent<InventoryComponent>(otherEntity, ComponentTypes.Inventory)
          const transform = ecs.getComponent<TransformComponent>(otherEntity, ComponentTypes.Transform)
          const rigidBody = ecs.getComponent<RigidBodyComponent>(otherEntity, ComponentTypes.RigidBody)

          if (health) {
            health.health -= 10
          } else if (inventory && transform && rigidBody) {
            if (inventory.materialCount > 0) {
              inventory.materialCount--;
              let spawnDirection;

              if (Vector2.mag(rigidBody.velocity) > 3) {
                spawnDirection = Vector2.normalize(rigidBody.velocity);
                spawnDirection.x *= -1;
                spawnDirection.y *= -1;  
              } else {
                spawnDirection = {
                  x: Math.random() * 2 - 1,
                  y: Math.random() * 2 - 1
                }
              }


              const materialPartial: Partial<IEntityData> = {
                position: {
                  x: transform.position.x + spawnDirection.x * 50 + Math.random() * 40 - 20,
                  y: transform.position.y + spawnDirection.y * 50 + Math.random() * 40 - 20
                },
                velocity: {
                  x: spawnDirection.x * Math.random() * 10,
                  y: spawnDirection.y * Math.random() * 10
                },
                hasDrag: true,
                triggerShape: 'circle',
                triggerSize: { x: 5, y: 5 },
                lifetime: 15000,
                spawnTime: Date.now(),
                flashTime: 5000
              }

              const material = ecs.createNewEntity(
                EntityType.Material,
                materialPartial,
                [
                  ComponentTypes.Transform,
                  ComponentTypes.TriggerCollider,
                  ComponentTypes.RigidBody,
                  ComponentTypes.Lifetime
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
          this.serverSocket.emit('despawnEntity', {
            entityId: entity.id,
            time: Date.now()
          })
          ecs.destroyEntity(entity)
        }
        break;
    }
  }
}

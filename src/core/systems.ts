import { moveTowards } from "simple-game-math/lib/Math";
import { collisions } from "simple-game-physics";
import { ColliderComponent, ComponentTypes, PlayerInputComponent, RigidBodyComponent, TransformComponent } from "./components";
import { IECS } from "./ecs";
import { IEntity } from "./entity";

const {
  resolveCircleVsCircleCollision,
  resolveCircleVsRectangleCollision,
  resolveRectangleVsCircleCollision,
  isCircleVsCircleCollision,
  isCircleVsRectangleCollision
} = collisions

export interface ISystem {
  update(ecs: IECS, dt: number, entity: IEntity): void;
}

export const PhysicsSystem: ISystem = {
  update: function (ecs: IECS, dt: number, entity: IEntity): void {
    const transform = ecs.getComponent<TransformComponent>(entity, ComponentTypes.Transform)
    const rigidBody = ecs.getComponent<RigidBodyComponent>(entity, ComponentTypes.RigidBody)

    if (rigidBody && transform) {
      rigidBody.velocity.x += rigidBody.acceleration.x * dt
      rigidBody.velocity.y += rigidBody.acceleration.y * dt
      const dragX = (rigidBody.dragScale ** 2) * dt * rigidBody.velocity.x
      const dragY = (rigidBody.dragScale ** 2) * dt * rigidBody.velocity.y
      rigidBody.velocity.x = moveTowards(rigidBody.velocity.x, 0, dragX)
      rigidBody.velocity.y = moveTowards(rigidBody.velocity.y, 0, dragY)
      transform.position.x += rigidBody.velocity.x * dt
      transform.position.y += rigidBody.velocity.y * dt
    }
  }
}

export const CollisionSystem: ISystem = {
  update: function (ecs: IECS, dt: number, entity: IEntity): void {
    const transform = ecs.getComponent<TransformComponent>(entity, ComponentTypes.Transform)
    const collider = ecs.getComponent<ColliderComponent>(entity, ComponentTypes.Collider)

    if (collider.static) {
      return
    }

    for (const otherEntity of ecs.entities) {
      if (otherEntity === entity) {
        continue
      }

      const otherTransform = ecs.getComponent<TransformComponent>(otherEntity, ComponentTypes.Transform)
      const otherCollider = ecs.getComponent<ColliderComponent>(otherEntity, ComponentTypes.Collider)

      if (otherTransform && otherCollider) {
        if (collider.type === 'circle' && otherCollider.type === 'circle' && isCircleVsCircleCollision(transform.position, otherTransform.position, collider.size.x, otherCollider.size.x)) {
          transform.position = resolveCircleVsCircleCollision(transform.position, otherTransform.position, collider.size.x, otherCollider.size.x)
        }

        if (collider.type === 'circle' && otherCollider.type === 'rectangle' && isCircleVsRectangleCollision(transform.position, collider.size.x, otherTransform.position, otherCollider.size)) {
          transform.position = resolveCircleVsRectangleCollision(transform.position, collider.size.x, otherTransform.position, otherCollider.size)
        }

        if (collider.type === 'rectangle' && otherCollider.type === 'circle' && isCircleVsRectangleCollision(transform.position, collider.size.x, otherTransform.position, otherCollider.size)) {
          otherTransform.position = resolveRectangleVsCircleCollision(otherTransform.position, otherCollider.size, transform.position, collider.size.x)
        }
      }
    }
  }
}

export const PlayerInputHandlerSystem: ISystem = {
  update: function (ecs: IECS, dt: number, entity: IEntity): void {
    const playerInput = ecs.getComponent<PlayerInputComponent>(entity, ComponentTypes.PlayerInput)
    const rigidBody = ecs.getComponent<RigidBodyComponent>(entity, ComponentTypes.RigidBody)
    const transform = ecs.getComponent<TransformComponent>(entity, ComponentTypes.Transform)

    if (playerInput && rigidBody) {
      rigidBody.acceleration.x = playerInput.moveInput.x * rigidBody.maxAcceleration
      rigidBody.acceleration.y = playerInput.moveInput.y * rigidBody.maxAcceleration
      transform.rotation = playerInput.lookRot
    }
  }
}
import { Vector2 } from "simple-game-math";
import { collisions, kinematics } from "simple-game-physics";
import { ColliderComponent, ComponentTypes, PlayerInputComponent, RigidBodyComponent, TransformComponent } from "./components";
import { IECS } from "./ecs";
import { IEntity } from "./entity";

const {
  resolveCircleVsRectangleCollision,
  resolveRectangleVsCircleCollision,
  isCircleVsCircleCollision,
  isCircleVsRectangleCollision
} = collisions

const {
  applyAcceleration,
  applyDrag,
  applyVelocity
} = kinematics

function resolveCircleVsCircleCollision(
  pos1: Vector2.IVector2,
  pos2: Vector2.IVector2,
  radius1: number,
  radius2: number,
): Vector2.IVector2 {
  const distance = Vector2.distance(pos2, pos1);
  const radiiSum = radius1 + radius2;
  const xDiff = pos1.x - pos2.x;
  const yDiff = pos1.y - pos2.y;
  const xUnit = xDiff / distance;
  const yUnit = yDiff / distance;

  console.log({
    pos1,
    pos2,
    distance,
    radiiSum,
    xDiff,
    yDiff,
    xUnit,
    yUnit
  })

  return {
    x: pos2.x + radiiSum * xUnit,
    y: pos2.y + radiiSum * yUnit,
  };
}

export interface ISystem {
  update(ecs: IECS, dt: number, entity: IEntity): void;
}

export const PhysicsSystem: ISystem = {
  update: function (ecs: IECS, dt: number, entity: IEntity): void {
    const transform = ecs.getComponent<TransformComponent>(entity, ComponentTypes.Transform)
    const rigidBody = ecs.getComponent<RigidBodyComponent>(entity, ComponentTypes.RigidBody)

    if (rigidBody && transform) {
      rigidBody.velocity = applyAcceleration(rigidBody.velocity, rigidBody.acceleration, dt)
      if (rigidBody.hasDrag) {
        rigidBody.velocity = applyDrag(rigidBody.velocity, 150, dt)
      }
      transform.position = applyVelocity(transform.position, rigidBody.velocity, dt)
    }
  }
}

export const CollisionSystem: ISystem = {
  update: function (ecs: IECS, dt: number, entity: IEntity): void {
    const transform = ecs.getComponent<TransformComponent>(entity, ComponentTypes.Transform)
    const collider = ecs.getComponent<ColliderComponent>(entity, ComponentTypes.Collider)

    if (!collider || !transform) {
      return
    }

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

export class BoundsSystem implements ISystem {
  constructor(private bounds: {x: number, y: number, w: number, h: number}) {}

  update(ecs: IECS, dt: number, entity: IEntity): void {
    const transform = ecs.getComponent<TransformComponent>(entity, ComponentTypes.Transform)

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
import { Vector2, mathv2 } from './vector2'
import { clamp, moveTowards } from './util'
import * as PIXI from 'pixi.js'

const ENTITY_DRAG = 0.28
const ENTITY_MAX_VELOCITY = 10

export class PhysicsBody extends PIXI.Container {
  public radius: number
  public velocity: Vector2
  public acceleration: Vector2

  public constructor (radius: number) {
    super()
    this.radius = radius
    this.velocity = { x: 0, y: 0 }
    this.acceleration = { x: 0, y: 0 }
  }

  public tick (delta: number, world: PhysicsWorld): void {
    if (Math.abs(this.acceleration.y) < 0.01) {
      this.velocity.y = moveTowards(this.velocity.y, 0.0, ENTITY_DRAG * delta)
    }

    if (Math.abs(this.acceleration.x) < 0.01) {
      this.velocity.x = moveTowards(this.velocity.x, 0.0, ENTITY_DRAG * delta)
    }

    const angle = mathv2.angle(this.acceleration, this.velocity)

    if (Math.abs(angle) > 1.5708) {
      // apply acceleration as drag when acceleration opposes velocity
      const dragAcceleration = mathv2.normalize(this.acceleration)
      dragAcceleration.x *= ENTITY_DRAG
      dragAcceleration.y *= ENTITY_DRAG

      this.velocity.x += dragAcceleration.x * delta
      this.velocity.y += dragAcceleration.y * delta
    } else {
      // apply acceleration
      this.velocity.x += this.acceleration.x * delta
      this.velocity.y += this.acceleration.y * delta
    }

    // Apply Velocity
    this.position.x += this.velocity.x * delta
    this.position.y += this.velocity.y * delta

    // Limit Velocity
    if (mathv2.length(this.velocity) > ENTITY_MAX_VELOCITY) {
      this.velocity = mathv2.normalize(this.velocity)
      this.velocity.x *= ENTITY_MAX_VELOCITY
      this.velocity.y *= ENTITY_MAX_VELOCITY
    }

    // Check For collision with all bodies
    for (const body of world.bodies) {
      if (body !== this) {
        const colliding = isCircleVsCircleCollision(
          this.position,
          body.position,
          this.radius,
          body.radius)

        if (colliding) {
          resolveCircleVsCircleCollision(
            this.position,
            body.position,
            this.radius,
            body.radius
          )
        }
      }
    }
  }
}

export interface PhysicsWorld {
  bodies: PhysicsBody[]
}

export function isCircleVsCircleCollision (
  pos1: Vector2,
  pos2: Vector2,
  radius1: number,
  radius2: number
): boolean {
  const radiiSum = radius1 + radius2
  const distance = mathv2.distance(pos1, pos2)
  return distance < radiiSum
}

export function resolveCircleVsCircleCollision (
  pos1: Vector2,
  pos2: Vector2,
  radius1: number,
  radius2: number
): void {
  const distance = mathv2.distance(pos1, pos2)
  const radiiSum = radius1 + radius2
  const xDiff = pos1.x - pos2.x
  const yDiff = pos1.y - pos2.y
  const xUnit = xDiff / distance
  const yUnit = yDiff / distance

  pos1.x = pos2.x + radiiSum * xUnit
  pos1.y = pos2.y + radiiSum * yUnit
}

export function isCircleVsRectangleCollision (
  circlePos: Vector2,
  circleRadius: number,
  rectPos: Vector2,
  rectSize: Vector2
): boolean {
  const nearestPoint = {
    x: clamp(circlePos.x, rectPos.x, rectPos.x + rectSize.x),
    y: clamp(circlePos.y, rectPos.y, rectPos.y + rectSize.y)
  }
  const rayToNearest = mathv2.subtract(nearestPoint, circlePos)
  const overlap = circleRadius - mathv2.length(rayToNearest)

  return overlap > 0
}

export function resolveCircleVsRectangleCollision (
  circlePos: Vector2,
  circleRadius: number,
  rectPos: Vector2,
  rectSize: Vector2
): void {
  const nearestPoint = {
    x: clamp(circlePos.x, rectPos.x, rectPos.x + rectSize.x),
    y: clamp(circlePos.y, rectPos.y, rectPos.y + rectSize.y)
  }

  const rayToNearest = mathv2.subtract(nearestPoint, circlePos)
  const overlap = circleRadius - mathv2.length(rayToNearest)

  const temp = mathv2.normalize(rayToNearest)
  temp.x = temp.x * overlap
  temp.y = temp.y * overlap

  const finalPos = mathv2.subtract(circlePos, temp)
  circlePos.x = finalPos.x
  circlePos.y = finalPos.y
}

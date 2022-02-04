import { Vector2, mathv2 } from './vector2'
import { clamp } from './util'
import * as PIXI from 'pixi.js'

const DRAG_SCALE = 0.01

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
    const drag = {
      x: DRAG_SCALE * this.velocity.x ** 2 * Math.sign(this.velocity.x),
      y: DRAG_SCALE * this.velocity.y ** 2 * Math.sign(this.velocity.y)
    }

    this.acceleration.x -= drag.x * delta
    this.acceleration.y -= drag.y * delta

    this.velocity.x += this.acceleration.x * delta
    this.velocity.y += this.acceleration.y * delta

    if (Math.abs(this.velocity.x) < 0.04) {
      this.velocity.x = 0
    }

    if (Math.abs(this.velocity.y) < 0.04) {
      this.velocity.y = 0
    }

    this.position.x += this.velocity.x * delta
    this.position.y += this.velocity.y * delta

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

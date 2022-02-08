import { Vector2, mathv2 } from './vector2'
import { clamp } from './util'

const DRAG_SCALE = 0.8

export interface PhysicsBody {
  position: Vector2
  rotation: number
  radius: number
  velocity: Vector2
  acceleration: Vector2
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
  a: PhysicsBody,
  b: PhysicsBody
): void {
  const distance = mathv2.distance(a.position, b.position)
  const radiiSum = a.radius + b.radius
  const xDiff = a.position.x - b.position.x
  const yDiff = a.position.y - b.position.y
  const xUnit = xDiff / distance
  const yUnit = yDiff / distance

  a.position.x = b.position.x + radiiSum * xUnit
  a.position.y = b.position.y + radiiSum * yUnit
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

export function tickPhysicsBody(phyBody : PhysicsBody, world : PhysicsWorld, delta : number) {
  const drag = {
    x: DRAG_SCALE * phyBody.velocity.x ** 2 * Math.sign(phyBody.velocity.x),
    y: DRAG_SCALE * phyBody.velocity.y ** 2 * Math.sign(phyBody.velocity.y)
  }

  phyBody.acceleration.x -= drag.x * delta
  phyBody.acceleration.y -= drag.y * delta

  phyBody.velocity.x += phyBody.acceleration.x * delta
  phyBody.velocity.y += phyBody.acceleration.y * delta

  if (Math.abs(phyBody.velocity.x) < 0.04) {
    phyBody.velocity.x = 0
  }

  if (Math.abs(phyBody.velocity.y) < 0.04) {
    phyBody.velocity.y = 0
  }

  phyBody.position.x += phyBody.velocity.x * delta
  phyBody.position.y += phyBody.velocity.y * delta

  // console.log(phyBody)

  // Check For collision with all bodies
  for (const body of world.bodies) {
    if (body !== phyBody) {
      const colliding = isCircleVsCircleCollision(
        phyBody.position,
        body.position,
        phyBody.radius,
        body.radius)

      if (colliding) {
        resolveCircleVsCircleCollision(
          phyBody,
          body
        )
      }
    }
  }
}
import { IVector2, mathv2 } from './vector2'
import { clamp } from './util'

export interface IPhysicsBody {
  position: IVector2
  rotation: number
  radius: number
  velocity: IVector2
  acceleration: IVector2
  dragScale: number
}

export interface IPhysicsWorld {
  bodies: IPhysicsBody[]
}

export function isCircleVsCircleCollision (
  pos1: IVector2,
  pos2: IVector2,
  radius1: number,
  radius2: number
): boolean {
  const radiiSum = radius1 + radius2
  const distance = mathv2.distance(pos1, pos2)
  return distance < radiiSum
}

export function resolveCircleVsCircleCollision (
  a: IPhysicsBody,
  b: IPhysicsBody
): IVector2 {
  const distance = mathv2.distance(a.position, b.position)
  const radiiSum = a.radius + b.radius
  const xDiff = a.position.x - b.position.x
  const yDiff = a.position.y - b.position.y
  const xUnit = xDiff / distance
  const yUnit = yDiff / distance

  return {
    x: b.position.x + radiiSum * xUnit,
    y: b.position.y + radiiSum * yUnit
  }
}

export function isCircleVsRectangleCollision (
  circlePos: IVector2,
  circleRadius: number,
  rectPos: IVector2,
  rectSize: IVector2
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
  circlePos: IVector2,
  circleRadius: number,
  rectPos: IVector2,
  rectSize: IVector2
): IVector2 {
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
  return finalPos;
}

export function tickPhysicsBody(phyBody : IPhysicsBody, world : IPhysicsWorld, delta : number) {
  const drag = {
    x: phyBody.dragScale * phyBody.velocity.x ** 2 * Math.sign(phyBody.velocity.x),
    y: phyBody.dragScale * phyBody.velocity.y ** 2 * Math.sign(phyBody.velocity.y)
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

  // Check For collision with all bodies
  for (const body of world.bodies) {
    if (body !== phyBody) {
      const colliding = isCircleVsCircleCollision(
        phyBody.position,
        body.position,
        phyBody.radius,
        body.radius)

      if (colliding) {
        phyBody.position = resolveCircleVsCircleCollision(
          phyBody,
          body
        )
      }
    }
  }
}
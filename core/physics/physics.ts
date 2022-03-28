import { IVector2, Vector2 } from '../vector2'
import { Util } from '../util'
import { IPhysicsBody } from './body'

export function isCircleVsCircleCollision (
  pos1: IVector2,
  pos2: IVector2,
  radius1: number,
  radius2: number
): boolean {
  const radiiSum = radius1 + radius2
  const distance = Vector2.distance(pos1, pos2)
  return distance < radiiSum
}

export function resolveCircleVsCircleCollision (
  a: IPhysicsBody,
  b: IPhysicsBody
): IVector2 {
  const distance = Vector2.distance(a.position, b.position)
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
    x: Util.clamp(circlePos.x, rectPos.x, rectPos.x + rectSize.x),
    y: Util.clamp(circlePos.y, rectPos.y, rectPos.y + rectSize.y)
  }
  const rayToNearest = Vector2.subtract(nearestPoint, circlePos)
  const overlap = circleRadius - Vector2.mag(rayToNearest)

  return overlap > 0
}

export function resolveCircleVsRectangleCollision (
  circlePos: IVector2,
  circleRadius: number,
  rectPos: IVector2,
  rectSize: IVector2
): IVector2 {
  const nearestPoint = {
    x: Util.clamp(circlePos.x, rectPos.x, rectPos.x + rectSize.x),
    y: Util.clamp(circlePos.y, rectPos.y, rectPos.y + rectSize.y)
  }

  const rayToNearest = Vector2.subtract(nearestPoint, circlePos)
  const overlap = circleRadius - Vector2.mag(rayToNearest)

  const temp = Vector2.normalize(rayToNearest)
  temp.x = temp.x * overlap
  temp.y = temp.y * overlap

  const finalPos = Vector2.subtract(circlePos, temp)
  return finalPos;
}

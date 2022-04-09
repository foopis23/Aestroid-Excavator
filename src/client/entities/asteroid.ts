import { Container, Graphics, Point } from "pixi.js";
import { ComponentTypes, IEntityData } from "../../core/components";
import { ECS } from "../../core/ecs";
import { EntityType } from "../../core/entity";
import { COLOR_SCHEME } from "../config";

export function createAsteroid(parent: Container, ecs: ECS, initial: Partial<IEntityData> = {}) {
  if (initial.size === undefined) {
    throw new Error("Asteroid size must be defined");
  }

  const points = []
  const numPoints = Math.random() * 6 + 4
  const maxRadius = initial.size.x
  let trueRadius = 0

  for (let p = 0; p < numPoints; p++) {
    const angle = p * Math.PI * 2 / numPoints
    const distance = (Math.random() * (maxRadius - (maxRadius * 0.5))) + (maxRadius * 0.5)
    points.push(new Point(Math.cos(angle) * distance, Math.sin(angle) * distance))
    if (trueRadius < distance) {
      trueRadius = distance
    }
  }

  const asteroidGraphics = new Graphics()
    .lineStyle(3, COLOR_SCHEME.asteroid)
    .drawPolygon(points)

  asteroidGraphics.pivot.x = 0.5
  asteroidGraphics.pivot.y = 0.5

  parent.addChild(asteroidGraphics)

  ecs.createNewEntity(
    EntityType.Asteroid,
    {
      ...initial,
      graphics: asteroidGraphics,
    },
    [
      ComponentTypes.Transform,
      ComponentTypes.RigidBody,
      ComponentTypes.Graphics,
      ComponentTypes.Collider,
      ComponentTypes.TransformSync
    ]
  )
}
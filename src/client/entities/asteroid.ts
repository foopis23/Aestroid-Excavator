import { Container, Graphics, Point } from "pixi.js";
import { ComponentTypes, IEntityData } from "../../core/components";
import { ECS } from "../../core/ecs";
import { EntityType } from "../../core/entity";
import { COLOR_SCHEME } from "../config";

export function createAsteroid(parent: Container, ecs: ECS, initial: Partial<IEntityData>, points: {x: number, y: number}[]) {
  if (initial.size === undefined) {
    throw new Error("Asteroid size must be defined");
  }

  const asteroidGraphics = new Graphics()
    .lineStyle(3, COLOR_SCHEME.asteroid)
    .drawPolygon(points.map((point) => new Point(point.x, point.y)))

  asteroidGraphics.pivot.x = 0.5
  asteroidGraphics.pivot.y = 0.5

  parent.addChild(asteroidGraphics)

  return ecs.createNewEntity(
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
      ComponentTypes.TransformSync,
      ComponentTypes.Health
    ]
  )
}
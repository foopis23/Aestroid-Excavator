import { Container, Graphics } from "pixi.js";
import { ComponentTypes, IEntityData } from "../../core/components";
import { ECS } from "../../core/ecs";
import { EntityType, IEntity } from "../../core/entity";
import { COLOR_SCHEME } from "../config";

function createMaterialEntityGraphics(radius: number) {
  const graphics = new Graphics()
    .lineStyle(3, COLOR_SCHEME.pickup)
    .drawCircle(0, 0, radius)
    .endFill()

  graphics.pivot.set(radius, radius)
  return graphics
}

export function createMaterialEntity(scene: Container, ecs: ECS, initial: Partial<IEntityData>): IEntity {
  const graphics = createMaterialEntityGraphics(initial.triggerSize?.x ?? 5)
  scene.addChild(graphics)

  return ecs.createNewEntity(
    EntityType.Material,
    {
      graphics,
      ...initial
    },
    [
      ComponentTypes.Transform,
      ComponentTypes.TransformSync,
      ComponentTypes.Graphics,
      ComponentTypes.Lifetime
    ]
  );
}
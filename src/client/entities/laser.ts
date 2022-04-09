import { Container, Graphics } from "pixi.js";
import { ComponentTypes, IEntityData } from "../../core/components";
import { ECS } from "../../core/ecs";
import { EntityType } from "../../core/entity";

export function createLaserGraphics(w: number, h: number) {
  const laserGraphics = new Graphics()
    .beginFill(0xff0000)
    .drawRect(0, 0, w, h)

  laserGraphics.pivot.set(w / 2, h / 2)
  return laserGraphics
}

export function createLaserEntity(scene: Container, ecs: ECS, initial: Partial<IEntityData>) {
  const laserGraphics = createLaserGraphics(initial.triggerSize?.x ?? 2, initial.triggerSize?.y ?? 10)
  scene.addChild(laserGraphics)

  return ecs.createNewEntity(
    EntityType.Projectile,
    {
      graphics: laserGraphics,
      ...initial,
    },
    [
      ComponentTypes.Transform,
      ComponentTypes.RigidBody,
      ComponentTypes.Graphics
    ]
  );
}

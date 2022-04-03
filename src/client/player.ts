import { Application, Graphics, Point } from "pixi.js"
import { ComponentTypes, IEntityData } from "../core/components"
import { ECS } from "../core/ecs"
import { EntityType } from "../core/entity"

export function createPlayerGraphics(color: number) {
  const playerGraphics = new Graphics()
    .lineStyle(3, color)
    .drawPolygon([new Point(0, 0), new Point(30, 15), new Point(0, 30)])

  playerGraphics.pivot.x = 15
  playerGraphics.pivot.y = 15

  return playerGraphics
}

export function createPlayer(app: Application, ecs: ECS, isLocal: boolean, initial: Partial<IEntityData>, color: number) {
  const playerGraphics = createPlayerGraphics(color)
  app.stage.addChild(playerGraphics)

  const initialPlayerData: Partial<IEntityData> = {
    ...initial,
    isLocalPlayer: isLocal,
    graphics: playerGraphics
  }

  return ecs.createNewEntity(
    EntityType.Player,
    initialPlayerData,
    [
      ComponentTypes.Transform,
      ComponentTypes.RigidBody,
      ComponentTypes.Collider,
      ComponentTypes.PlayerInput,
      ComponentTypes.Graphics,
      ComponentTypes.LocalPlayer
    ]
  )
}

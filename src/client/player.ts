import { Application, Graphics, Point } from "pixi.js"
import { IVector2 } from "simple-game-math/lib/Vector2"
import { ComponentTypes } from "../core/components"
import { ECS } from "../core/ecs"
import { COLOR_SCHEME } from "./config"

export function createPlayerGraphics(color: number) {
  const playerGraphics = new Graphics()
    .lineStyle(3, color)
    .drawPolygon([new Point(0, 0), new Point(30, 15), new Point(0, 30)])

  playerGraphics.pivot.x = 15
  playerGraphics.pivot.y = 15

  return playerGraphics
}

export function createPlayer(app: Application, ecs: ECS, color: number = COLOR_SCHEME.team1, isLocal: boolean, startLocation: IVector2 = { x: 0, y: 0 }) {
  const playerGraphics = createPlayerGraphics(color)
  app.stage.addChild(playerGraphics)

  ecs.createNewEntity(
    {
      position: startLocation,
      isLocalPlayer: isLocal,
      graphics: playerGraphics,
      static: false,
      maxAcceleration: 1000,
      type: 'circle',
      size: { x: 20, y: 20 },
      priority: 20
    },
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

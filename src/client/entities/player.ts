import { Container, Graphics, Point, Text } from "pixi.js"
import { ComponentTypes, IEntityData } from "../../core/components"
import { ECS } from "../../core/ecs"
import { EntityType } from "../../core/entity"

export function createPlayerGraphics(color: number) {
  const container = new Container();

  const position = new Container();
  position.name = "position";
  container.addChild(position);

  const rotation = new Container();
  rotation.name = "rotation";
  position.addChild(rotation);

  const playerGraphics = new Graphics()
    .lineStyle(3, color)
    .drawPolygon([new Point(0, 0), new Point(30, 15), new Point(0, 30)])

  playerGraphics.pivot.x = 15
  playerGraphics.pivot.y = 15

  playerGraphics.name = "playerGraphics";
  rotation.addChild(playerGraphics);

  const inventoryDisplay = new Text("hello world", {
    fontFamily: "Arial",
    fontSize: 18,
    fill: 0xffffff,
    align: "center",
  })
  // TODO: figure out how to not hard code this later
  inventoryDisplay.position.set(0, -40)
  inventoryDisplay.pivot.set(inventoryDisplay.width / 2, inventoryDisplay.height / 2)
  inventoryDisplay.name = "inventoryDisplay"
  position.addChild(inventoryDisplay);

  return container
}

export function createPlayer(parent: Container, ecs: ECS, isLocal: boolean, initial: Partial<IEntityData>, color: number) {
  const playerGraphics = createPlayerGraphics(color)
  parent.addChild(playerGraphics)

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
      ComponentTypes.LocalPlayer,
      ComponentTypes.TransformSync,
      ComponentTypes.Inventory
    ]
  )
}

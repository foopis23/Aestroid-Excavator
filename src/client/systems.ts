import { ComponentTypes, GraphicsComponent, TransformComponent, LocalPlayerComponent, PlayerInputComponent } from "../core/components";
import { ISystem } from "../core/systems";
import { Application } from "pixi.js";
import { Vector2 } from "simple-game-math";
import { IECS } from "../core/ecs";
import { IEntity } from "../core/entity";
import { useMousePos } from "./input";
import { isKeyDown } from "./input";

export const GraphicsSystem: ISystem = {
  update: (ecs, _dt, entity) => {
    const transform = ecs.getComponent<TransformComponent>(entity, ComponentTypes.Transform)
    const graphics = ecs.getComponent<GraphicsComponent>(entity, ComponentTypes.Graphics)

    if (!transform || !graphics) {
      return
    }

    if (graphics.graphics) {
      graphics.graphics.position.x = transform.position.x
      graphics.graphics.position.y = transform.position.y
      graphics.graphics.rotation = transform.rotation
    }
  }
}

export class PollInputSystem implements ISystem {
  private getMousePos: () => { x: number, y: number }
  constructor(private app: Application) {
    const { getMousePos } = useMousePos(this.app.stage)
    this.getMousePos = getMousePos
  }

  update(ecs: IECS, _dt: number, entity: IEntity): void {
    const inputComponent = ecs.getComponent<PlayerInputComponent>(entity, ComponentTypes.PlayerInput)
    const transform = ecs.getComponent<TransformComponent>(entity, ComponentTypes.Transform)
    const localPlayer = ecs.getComponent<LocalPlayerComponent>(entity, ComponentTypes.LocalPlayer)

    if (!inputComponent || !transform || !localPlayer) {
      return
    }

    if (!localPlayer.isLocalPlayer) {
      return
    }

    let moveInput = { x: 0, y: 0 }

    if (isKeyDown('d')) {
      moveInput.x += 1
    }

    if (isKeyDown('a')) {
      moveInput.x -= 1
    }

    if (isKeyDown('w')) {
      moveInput.y -= 1
    }

    if (isKeyDown('s')) {
      moveInput.y += 1
    }

    if (Vector2.mag(moveInput) > 1.0) {
      moveInput = Vector2.normalize(moveInput)
    }

    const mousePos = this.getMousePos()
    const lookRot = Math.atan2(
      mousePos.y - transform.position.y,
      mousePos.x - transform.position.x
    )

    inputComponent.moveInput = moveInput
    inputComponent.lookRot = lookRot
  }
}
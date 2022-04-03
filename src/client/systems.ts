import { ComponentTypes, GraphicsComponent, TransformComponent, LocalPlayerComponent, PlayerInputComponent } from "../core/components";
import { AbstractNetworkSyncSystem, AbstractSimpleSystem, ISystem } from "../core/systems";
import { Application } from "pixi.js";
import { Vector2 } from "simple-game-math";
import { IECS } from "../core/ecs";
import { IEntity } from "../core/entity";
import { useMousePos } from "./input";
import { isKeyDown } from "./input";
import { Socket } from "socket.io-client";

export class GraphicsSystem extends AbstractSimpleSystem {
  update (ecs: IECS, _dt: number, entity: IEntity): void {
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

export class PollInputSystem extends AbstractSimpleSystem {
  private getMousePos: () => { x: number, y: number }
  constructor(private app: Application) {
    super()
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

export class SyncInputSystem extends AbstractNetworkSyncSystem  {
  constructor(syncDelta: number, private socket: Socket) {
    super(syncDelta)
  }
  
  sync(ecs: IECS, entity: IEntity): void {
    const inputComponent = ecs.getComponent<PlayerInputComponent>(entity, ComponentTypes.PlayerInput)
    const transform = ecs.getComponent<TransformComponent>(entity, ComponentTypes.Transform)
    const localPlayer = ecs.getComponent<LocalPlayerComponent>(entity, ComponentTypes.LocalPlayer)

    if (!inputComponent || !transform || !localPlayer) {
      return
    }

    if (!localPlayer.isLocalPlayer) {
      return
    }

    this.socket.emit('playerInput', {
      moveInput: inputComponent.moveInput,
      lookRot: inputComponent.lookRot,
      entityId: entity.id,
      time: Date.now()
    })
  }
}
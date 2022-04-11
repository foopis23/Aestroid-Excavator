import { ComponentTypes, GraphicsComponent, TransformComponent, LocalPlayerComponent, PlayerInputComponent, TransformSyncComponent, HealthComponent, InventoryComponent } from "../core/components";
import { AbstractNetworkSyncSystem, AbstractSimpleSystem, doCollisionLoop, doPhysicsLoop, doPlayerInputHandleLoop } from "../core/systems";
import { Application, Container, Text } from "pixi.js";
import { Vector2 } from "simple-game-math";
import { IECS } from "../core/ecs";
import { IEntity } from "../core/entity";
import { useMousePos } from "./util/input";
import { isKeyDown } from "./util/input";
import { Socket } from "socket.io-client";

export class GraphicsSystem extends AbstractSimpleSystem {
  update(ecs: IECS, _dt: number, entity: IEntity): void {
    const transform = ecs.getComponent<TransformComponent>(entity, ComponentTypes.Transform)
    const graphics = ecs.getComponent<GraphicsComponent>(entity, ComponentTypes.Graphics)

    if (!transform || !graphics) {
      return
    }

    if (graphics.graphics) {
      const graphicsContainer = graphics.graphics
      
      const positionContainer = graphics.graphics.getChildByName('position') as Container
      if (graphics.graphics.getChildByName('position')) {
        positionContainer.x = transform.position.x
        positionContainer.y = transform.position.y

        const rotationContainer = positionContainer.getChildByName('rotation') as Container
        if (rotationContainer) {
          rotationContainer.rotation = transform.rotation
        }

      } else {
        graphicsContainer.position.x = transform.position.x
        graphicsContainer.position.y = transform.position.y
        graphicsContainer.rotation = transform.rotation
      }

      const health = ecs.getComponent<HealthComponent>(entity, ComponentTypes.Health)
      if (health) {
        graphicsContainer.alpha = health.health / health.maxHealth
      }
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

    const isFire = isKeyDown(' ') || isKeyDown('space')

    inputComponent.moveInput = moveInput
    inputComponent.lookRot = lookRot
    inputComponent.isFire = isFire

    inputComponent.inputBuffer.push({
      time: Date.now(),
      moveInput,
      lookRot,
      isFire
    })
  }
}

export class SyncInputSystem extends AbstractNetworkSyncSystem {
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
      isFire: inputComponent.isFire,
      time: Date.now()
    })
  }
}

export class TransformSmoothingSystem extends AbstractSimpleSystem {
  constructor(private networkDelay: number) {
    super()
  }

  update(ecs: IECS, _dt: number, entity: IEntity): void {
    const transform = ecs.getComponent<TransformComponent>(entity, ComponentTypes.Transform)
    const transformSync = ecs.getComponent<TransformSyncComponent>(entity, ComponentTypes.TransformSync)
    const localPlayer = ecs.getComponent<LocalPlayerComponent>(entity, ComponentTypes.LocalPlayer)

    if (localPlayer && localPlayer.isLocalPlayer) {
      // if we are the local player, we don't need to smooth the transform
      return
    }

    if (transform && transformSync) {
      const time = Date.now() - this.networkDelay

      // find the last and the next position in the buffer
      let lastPosIndex = -1;
      let nextPosIndex = -1;
      for (let i = 0; i < transformSync.transformBuffer.length; i++) {
        if (transformSync.transformBuffer[i].time > time) {
          nextPosIndex = i;
          break;
        }
        lastPosIndex = i;
      }

      // if we don't have a next position, just return
      if (lastPosIndex === -1 || nextPosIndex === -1) {
        return;
      }

      // interpolate between the two positions
      const lastPos = transformSync.transformBuffer[lastPosIndex];
      const nextPos = transformSync.transformBuffer[nextPosIndex];

      if (Vector2.distance(nextPos.value.position, lastPos.value.position) > 50) {
        // if the distance between the two positions is too big, just use the next position
        transform.position.x = nextPos.value.position.x;
        transform.position.y = nextPos.value.position.y;
        transform.rotation = nextPos.value.rotation;
      } else {
        const interpolation = (time - lastPos.time) / (nextPos.time - lastPos.time);
        transform.position.x = lastPos.value.position.x + (nextPos.value.position.x - lastPos.value.position.x) * interpolation;
        transform.position.y = lastPos.value.position.y + (nextPos.value.position.y - lastPos.value.position.y) * interpolation;
        transform.rotation = lastPos.value.rotation + (nextPos.value.rotation - lastPos.value.rotation) * interpolation;  
      }

      // clean up old transforms
      transformSync.transformBuffer.splice(0, lastPosIndex);

    }
  }
}

export class ClientPredictionSystem extends AbstractSimpleSystem {
  update(ecs: IECS, _dt: number, entity: IEntity): void {
    const inputComponent = ecs.getComponent<PlayerInputComponent>(entity, ComponentTypes.PlayerInput)
    const transform = ecs.getComponent<TransformComponent>(entity, ComponentTypes.Transform)
    const transformSync = ecs.getComponent<TransformSyncComponent>(entity, ComponentTypes.TransformSync)
    const localPlayer = ecs.getComponent<LocalPlayerComponent>(entity, ComponentTypes.LocalPlayer)

    // only do client prediction for local players
    if (!localPlayer || !localPlayer.isLocalPlayer) {
      return
    }

    // if we don't have a transform or a transform sync component, we can't do client prediction
    if (inputComponent && transform && transformSync) {
      transformSync?.localTransformBuffer.push({value: {position: transform.position, rotation: transform.rotation}, time: Date.now()})

      // if we don't have any server data, just return
      if (transformSync.transformBuffer.length < 1) {
        return
      }

      const lastTransform = transformSync.transformBuffer[transformSync.transformBuffer.length - 1];
      const closestTransformInHistory = transformSync.localTransformBuffer.reduce((prev, value) => {
        if (Math.abs(prev.time - lastTransform.time) > Math.abs(value.time - lastTransform.time)) {
          prev.value.position = value.value.position;
          prev.value.rotation = value.value.rotation;
          prev.time = value.time;
        }
        return prev;
      }, transformSync.localTransformBuffer[0])

      // remove all inputs that are older than the last transform
      inputComponent.inputBuffer = inputComponent.inputBuffer.filter(input => input.time > lastTransform.time);

      // if the distance between the last transform and the closest transform in history is too small, just return
      if (Vector2.distance(closestTransformInHistory.value.position, lastTransform.value.position) < 40) {
        return
      }

      console.log('correcting player position')
      transform.position = lastTransform.value.position;
      transform.rotation = lastTransform.value.rotation;

      let lastTime = lastTransform.time;
      for (const input of inputComponent.inputBuffer) {
        const dt = (input.time - lastTime) / 1000
        inputComponent.lookRot = input.lookRot;
        inputComponent.moveInput = input.moveInput
        doPlayerInputHandleLoop(ecs, entity)
        doPhysicsLoop(ecs, dt, entity)
        doCollisionLoop(ecs, entity)
        lastTime = input.time
      }

      // clear buffer
      transformSync.localTransformBuffer = transformSync.localTransformBuffer.filter(transform => transform.time < lastTransform.time)
      transformSync.transformBuffer.splice(0, transformSync.transformBuffer.length - 1)
    }
  }
}

function findChildGraphicsObjectByName(container: Container, name: string): Container | undefined {
  if (container === undefined) {
    return undefined
  }

  if (container.name === name) {
    return container
  }

  if (container.children.length < 0) {
    return undefined
  }

  for (const child of container.children) {
    const result = findChildGraphicsObjectByName(child as Container, name)
    if (result) {
      return result
    }
  }
  return undefined
}

export class InventoryDisplaySystem extends AbstractSimpleSystem {
  update(ecs: IECS, _dt: number, entity: IEntity): void {
    const transform = ecs.getComponent<TransformComponent>(entity, ComponentTypes.Transform)
    const graphics = ecs.getComponent<GraphicsComponent>(entity, ComponentTypes.Graphics)
    const inventory = ecs.getComponent<InventoryComponent>(entity, ComponentTypes.Inventory)

    if (!transform || !graphics || !inventory) {
      return
    }

    if (graphics.graphics) {
      const inventoryDisplay = findChildGraphicsObjectByName(graphics.graphics, 'inventoryDisplay') as Text
      if (inventoryDisplay) {
        inventoryDisplay.text = inventory.materialCount.toString()
        inventoryDisplay.pivot.set(inventoryDisplay.width / 2, inventoryDisplay.height / 2)
      }
    }1
  }
}
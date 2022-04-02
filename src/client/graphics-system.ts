import { ComponentTypes, GraphicsComponent, TransformComponent } from "../core/components";
import { ISystem } from "../core/systems";

export const GraphicsSystem: ISystem = {
  update: (ecs, _dt, entity) => {
    const transform = ecs.getComponent<TransformComponent>(entity, ComponentTypes.Transform)
    const graphics = ecs.getComponent<GraphicsComponent>(entity, ComponentTypes.Graphics)

    if (!transform || !graphics) {
      return
    }

    graphics.graphics.position.x = transform.position.x
    graphics.graphics.position.y = transform.position.y
    graphics.graphics.rotation = transform.rotation
  }
}
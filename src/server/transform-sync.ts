import { Server } from "socket.io";
import { ComponentTypes, TransformComponent } from "../core/components";
import { IECS } from "../core/ecs";
import { IEntity } from "../core/entity";
import { ISystem } from "../core/systems";

export class TransformSyncSystem implements ISystem {
  public static readonly NETWORK_TICK_DELTA = 1000 / 15; 
  private timeSinceSync: number;

  constructor(private serverSocket: Server) {
    this.timeSinceSync = 0
  }

  update(ecs: IECS, dt: number, entity: IEntity): void {
    this.timeSinceSync += dt
    if (this.timeSinceSync < TransformSyncSystem.NETWORK_TICK_DELTA) {
      return
    }
    this.timeSinceSync = 0

    const transform = ecs.getComponent<TransformComponent>(entity, ComponentTypes.Transform)
    if (transform) {
      this.serverSocket.emit("syncTransform", {
        id: entity.id,
        position: transform.position,
        rotation: transform.rotation,
        time: Date.now()
      });
    }
  }
}
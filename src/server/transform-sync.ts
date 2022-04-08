import { Server } from "socket.io";
import { ComponentTypes, TransformComponent } from "../core/components";
import { IECS } from "../core/ecs";
import { IEntity } from "../core/entity";
import { AbstractNetworkSyncSystem } from "../core/systems";

export class TransformSyncSystem extends AbstractNetworkSyncSystem {
  constructor(syncRate: number, private serverSocket: Server) {
    super(syncRate)
  }

  sync(ecs: IECS, entity: IEntity): void {
    const transform = ecs.getComponent<TransformComponent>(entity, ComponentTypes.Transform)
    if (transform) {
      this.serverSocket.emit("syncTransform", {
        entityId: entity.id,
        position: transform.position,
        rotation: transform.rotation,
        time: Date.now()
      });
    }
  }
}
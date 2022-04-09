import { Application, Container, settings, TickerCallback } from "pixi.js";
import { Socket } from "socket.io-client";
import { ComponentTypes, GraphicsComponent, TransformSyncComponent } from "../core/components";
import { ECS } from "../core/ecs";
import { EntityType } from "../core/entity";
import { EntityPacket, SpawnEntityPacket, SyncTransformPacket } from "../core/net";
import { BoundsSystem, CollisionSystem, PhysicsSystem, PlayerInputHandlerSystem } from "../core/systems";
import { BASE_RESOLUTION, COLOR_SCHEME } from "./config";
import { createAsteroid } from "./entities/asteroid";
import { createPlayer } from "./entities/player";
import { ClientPredictionSystem, GraphicsSystem, PollInputSystem, SyncInputSystem, TransformSmoothingSystem } from "./systems";

export class ClientGame {
  protected readonly ecs: ECS;
  protected readonly targetFPMS: number;
  protected readonly tickerCallback: TickerCallback<number>;
  protected localPlayerId: number | undefined;
  protected readonly scene: Container;

  constructor(protected readonly socket: Socket, protected readonly app: Application) {
    this.ecs = new ECS(
      new PollInputSystem(app),
      new SyncInputSystem(1 / 30, socket),
      new PlayerInputHandlerSystem(),
      new PhysicsSystem(),
      new CollisionSystem(),
      new BoundsSystem({ x: 0, y: 0, w: BASE_RESOLUTION.x, h: BASE_RESOLUTION.y }),
      new TransformSmoothingSystem(200),
      new ClientPredictionSystem(),
      new GraphicsSystem()
    )

    this.tickerCallback = (deltaFrame: number) => this.update(deltaFrame);
    this.targetFPMS = settings.TARGET_FPMS ?? 0.06

    this.scene = new Container();
    this.app.stage.addChild(this.scene);

    this.socket.on("spawnEntity", (data: SpawnEntityPacket) => this.spawnEntity(data))
    this.socket.on("despawnEntity", (data: EntityPacket) => this.despawnEntity(data))
    this.socket.on("syncTransform", (data: SyncTransformPacket) => this.syncTransform(data))
    this.socket.on("assignPlayerId", (data: number) => this.assignPlayerId(data))
  }

  public spawnEntity(data: SpawnEntityPacket) {
    if (!this.ecs.isEntityIdFree(data.entityId)) {
      return
    }

    switch (data.type) {
      case EntityType.Player:
        createPlayer(
          this.scene,
          this.ecs,
          this.localPlayerId == data.entityId,
          data.initial ?? {},
          (this.localPlayerId == data.entityId) ? COLOR_SCHEME.team1 : COLOR_SCHEME.team2
        )
        break;
      case EntityType.Asteroid:
        if (data.otherData?.points === undefined) {
          throw new Error("Asteroid spawn packet missing points")
        }
        
        createAsteroid(this.scene, this.ecs, data.initial ?? {}, data.otherData?.points)
        break;
      default:
        throw new Error("Unknown Entity Type From Server")
    }
  }

  public despawnEntity(data: EntityPacket) {
    const entity = this.ecs.entities[data.entityId]
    if (entity) {
      // TODO: Maybe find a better way to integrate graphics into this system
      const graphics = this.ecs.getComponent<GraphicsComponent>(entity, ComponentTypes.Graphics)
      if (graphics && graphics.graphics) {
        this.scene.removeChild(graphics.graphics)
      }
      this.ecs.destroyEntityById(data.entityId)
    }
  }

  public assignPlayerId(playerId: number) {
    this.localPlayerId = playerId
  }

  public syncTransform(data: SyncTransformPacket) {
    const entity = this.ecs.entities[data.entityId]
    if (entity) {
      const transformSync = this.ecs.getComponent<TransformSyncComponent>(entity, ComponentTypes.TransformSync)
      if (transformSync) {
        transformSync.transformBuffer.push({
          time: data.time,
          value: {
            position: data.position,
            rotation: data.rotation,
          }
        })
      }
    }
  }

  public start() {
    this.app.ticker.add(this.tickerCallback)
  }

  public destroy() {
    this.app.ticker.remove(this.tickerCallback)
    this.app.stage.removeChild(this.scene)

    this.socket.removeAllListeners("spawnEntity")
    this.socket.removeAllListeners("despawnEntity")
    this.socket.removeAllListeners("syncTransform")
    this.socket.removeAllListeners("assignPlayerId")
  }

  protected update(deltaFrame: number) {
    const delta = (deltaFrame / this.targetFPMS) / 1000
    this.ecs.update(delta)
  }
}
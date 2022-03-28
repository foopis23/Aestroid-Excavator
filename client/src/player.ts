import * as PIXI from 'pixi.js'
import { Util } from '../../core/util';
import { IPlayerUpdateQueueData } from './types';
import { IPlayer } from '../../core/player'
import { IVector2, Vector2 } from '../../core/vector2';
import { isKeyDown } from './input';
import { getMousePos } from './main';
import { IPlayerInputPacket } from '../../core/net';
import { IPhysicsWorld } from '../../core/physics/world';
import { Application } from 'pixi.js';

export interface IClientPlayerEntity extends IPlayer {
  readonly isLocalPlayer: boolean;
  tick(delta: number, currentTime: number, world: IPhysicsWorld): void;
}

export interface IPlayerInputData extends IPlayerInputPacket {
  delta: number
}

export class ClientPlayerEntity extends PIXI.Container implements IClientPlayerEntity {
  public serverUpdates: IPlayerUpdateQueueData[];
  public inputs: IPlayerInputData[];
  private inputSeq: number;
  private lastServerInput: number;
  public lastInputProcessed: number;

  public get lookRot(): number {
    return this.rotation
  }

  public set lookRot(number: number) {
    this.rotation = number
  }

  constructor(
    private app: Application,
    private readonly clientSmoothing: number,
    public readonly id: string,
    public readonly isLocalPlayer: boolean,
    public isStatic: boolean = false,
    public radius: number = 20,
    public velocity: IVector2 = { x: 0, y: 0 },
    public acceleration: IVector2 = { x: 0, y: 0 },
    public dragScale: number = 0.8,
    public moveInput: IVector2 = { x: 0, y: 0 },
  ) {
    super()
    this.addChild(
      new PIXI.Graphics()
        .beginFill(0x00ff00)
        .drawPolygon([new PIXI.Point(0, 0), new PIXI.Point(1, 0.5), new PIXI.Point(0, 1)])
    )
    this.pivot.x = 0.5
    this.pivot.y = 0.5
    this.scale.x = 30
    this.scale.y = 30
    this.serverUpdates = []
    this.inputs = []
    this.inputSeq = 0
    this.lastServerInput = 0
    this.lastInputProcessed = 0
  }
  
  public onPlayerJoin(): void {
    this.app.stage.addChild(this)
  }

  public onPlayerLeave(): void {
    this.app.stage.removeChild(this)
  }

  public applyInput(): void {
    throw new Error('Method not implemented.');
  }
  
  private pollInput() {
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

    const mousePos = getMousePos()
    const lookRot = Math.atan2(
      mousePos.y - this.position.y,
      mousePos.x - this.position.x
    )

    this.moveInput = moveInput
    this.lookRot = lookRot
  }


  public tick(delta: number, currentTime: number, world: IPhysicsWorld): void {
    if (this.isLocalPlayer) {
      this.pollInput()

      this.inputs.push({
        moveInput: this.moveInput,
        lookRot: this.lookRot,
        id: this.inputSeq,
        delta: delta
      })

      this.inputSeq++;
      if (!Number.isSafeInteger(this.inputSeq)) {
        this.inputSeq = 0
      }

      const latestServerUpdate = this.serverUpdates[this.serverUpdates.length - 1]

      if (this.lastServerInput < latestServerUpdate.lastInputProcessed) {
        this.lastServerInput = latestServerUpdate.lastInputProcessed
        this.inputs = this.inputs.filter((input) => {
          return latestServerUpdate.lastInputProcessed < input.id;
        })

        this.position.x = latestServerUpdate.position.x
        this.position.y = latestServerUpdate.position.y
        this.rotation = latestServerUpdate.rotation

        const currentAcceleration = this.acceleration

        this.acceleration = currentAcceleration
      }
    } else {
      let lastUpdate;
      let targetUpdate;

      for (let i = 0; i < this.serverUpdates.length - 1; i++) {
        const tempLast = this.serverUpdates[i]
        const tempTarget = this.serverUpdates[i + 1]

        if (currentTime >= tempLast.time && currentTime <= tempTarget.time) {
          lastUpdate = tempLast
          targetUpdate = tempTarget
          break
        }
      }

      if (lastUpdate && targetUpdate) {
        const difference = targetUpdate.time - currentTime;
        const maxDiff = (targetUpdate.time - lastUpdate.time)
        const timePoint = ((maxDiff - difference) / maxDiff)

        const pos = { x: 0, y: 0 }
        let rot = 0

        pos.x = Util.lerp(lastUpdate.position.x, targetUpdate.position.x, timePoint)
        pos.y = Util.lerp(lastUpdate.position.y, targetUpdate.position.y, timePoint)
        rot = Util.lerp(lastUpdate.rotation, targetUpdate.rotation, timePoint)

        //client smoothing
        this.position.x = Util.lerp(this.position.x, pos.x, this.clientSmoothing * delta)
        this.position.y = Util.lerp(this.position.y, pos.y, this.clientSmoothing * delta)
        this.rotation = Util.lerp(this.rotation, rot, this.clientSmoothing * delta)
      }
    }
  }
}

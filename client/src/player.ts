import * as PIXI from 'pixi.js'
import { lerp } from '../../core/util';
import { PlayerUpdateQueueData } from './types';
import { Player } from '../../core/player'
import { Vector2, mathv2 } from '../../core/vector2';
import { isKeyDown } from './input';
import { getMousePos } from './main';

export interface ClientPlayerEntity extends Player {
  readonly isLocalPlayer: boolean;
  tick(delta: number, currentTime: number): void;
}

export class PlayerEntity extends PIXI.Container implements ClientPlayerEntity {
  public serverUpdates : PlayerUpdateQueueData[];

  public get lookRot(): number {
    return this.rotation
  }

  public set lookRot(number: number) {
    this.rotation = number
  }

  constructor(
    private readonly clientSmoothing : number,
    public readonly id: string,
    public readonly isLocalPlayer: boolean,
    public radius: number = 20,
    public velocity: Vector2 = {x: 0, y: 0},
    public acceleration: Vector2 = {x: 0, y: 0},
    public dragScale: number = 0.8,
    public moveInput: Vector2 = {x: 0, y: 0},
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

    if (mathv2.length(moveInput) > 1.0) {
      moveInput = mathv2.normalize(moveInput)
    }

    const mousePos = getMousePos()
    const lookRot = Math.atan2(
      mousePos.y - this.position.y,
      mousePos.x - this.position.x
    )

    this.moveInput = moveInput
    this.lookRot = lookRot
  }


  public tick(delta: number, currentTime: number): void {
    if (this.isLocalPlayer) {
      this.pollInput()
    }

    let lastUpdate;
    let targetUpdate;

    for (let i=0; i < this.serverUpdates.length -1; i++) {
      let tempLast = this.serverUpdates[i]
      let tempTarget = this.serverUpdates[i+1]

      if (currentTime >= tempLast.time && currentTime <= tempTarget.time) {
        lastUpdate = tempLast
        targetUpdate = tempTarget
        break
      }
    }

    if (lastUpdate && targetUpdate) {
      const difference = targetUpdate.time - currentTime;
      const maxDiff = (targetUpdate.time - lastUpdate.time)
      const timePoint = ((maxDiff - difference)/maxDiff)

      let pos = {x: 0, y: 0}
      let rot = 0

      pos.x = lerp(lastUpdate.position.x, targetUpdate.position.x, timePoint )
      pos.y = lerp(lastUpdate.position.y, targetUpdate.position.y, timePoint )
      rot = lerp(lastUpdate.rotation, targetUpdate.rotation, timePoint)
      
      //client smoothing
      this.position.x = lerp(this.position.x, pos.x, this.clientSmoothing * delta)
      this.position.y = lerp(this.position.y, pos.y, this.clientSmoothing * delta)
      this.rotation = lerp(this.rotation, rot, this.clientSmoothing * delta)
    }
  }
}

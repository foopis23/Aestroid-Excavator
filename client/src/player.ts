import * as PIXI from 'pixi.js'
import { lerp } from '../../core/util';
import { PlayerUpdateQueueData } from './types';

export class PlayerEntity extends PIXI.Container {
  public serverUpdates : PlayerUpdateQueueData[];

  constructor(private readonly clientSmoothing : number, private readonly isLocalPlayer: boolean) {
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

  public tick(delta: number, currentTime: number): void {
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

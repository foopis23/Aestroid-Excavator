import { Container, Graphics, Point } from 'pixi.js'
import { IPlayerUpdateQueueData } from './types'
import { AbstractPlayer } from '../core/player'
import { isKeyDown } from './input'
import { getMousePos } from './main'
import { IPlayerInputPacket } from '../core/net'
import { IPhysicsWorld } from '../core/physics/world'
import { Application } from 'pixi.js'

import { Vector2, Math as GameMath } from 'simple-game-math'

export interface IClientPlayerEntity  {
  readonly isLocalPlayer: boolean;
  tick(delta: number, currentTime: number, world: IPhysicsWorld): void;
}

export interface IPlayerInputData extends IPlayerInputPacket {
  delta: number
}

export class ClientPlayerEntity extends AbstractPlayer {
  public container: Container
  private readonly graphicsApp: Application

  constructor(id: string, radius: number) {
    super(id, radius)
    this.container = new Graphics()
      .beginFill(0x00ff00)
      .drawPolygon([new Point(0, 0), new Point(1, 0.5), new Point(0, 1)])

    this.graphicsApp.stage.addChild(this.container)
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
}

// export class ClientPlayerEntity extends AbstractPlayer implements IClientPlayerEntity {
//   public serverUpdates: IPlayerUpdateQueueData[];
//   public inputs: IPlayerInputData[];
//   private inputSeq: number;
//   private lastServerInput: number;
//   public lastInputProcessed: number;

//   public override get lookRot(): number {
//     return this.rotation
//   }

//   public set lookRot(number: number) {
//     this.rotation = number
//   }

//   constructor(
//     private app: Application,
//     private readonly clientSmoothing: number,
//     public readonly id: string,
//     public readonly isLocalPlayer: boolean,
//     public isStatic: boolean = false,
//     public radius: number = 20,
//     public velocity: Vector2.IVector2 = { x: 0, y: 0 },
//     public acceleration: Vector2.IVector2 = { x: 0, y: 0 },
//     public dragScale: number = 0.8,
//     public moveInput: Vector2.IVector2 = { x: 0, y: 0 },
//   ) {
//     super()
//     this.addChild(
//       new Graphics()
//         .beginFill(0x00ff00)
//         .drawPolygon([new Point(0, 0), new Point(1, 0.5), new Point(0, 1)])
//     )
//     this.pivot.x = 0.5
//     this.pivot.y = 0.5
//     this.scale.x = 30
//     this.scale.y = 30
//     this.serverUpdates = []
//     this.inputs = []
//     this.inputSeq = 0
//     this.lastServerInput = 0
//     this.lastInputProcessed = 0
//   }
  
//   public onPlayerJoin(): void {
//     this.app.stage.addChild(this)
//   }

//   public onPlayerLeave(): void {
//     this.app.stage.removeChild(this)
//   }
  
//   private pollInput() {
//     let moveInput = { x: 0, y: 0 }

//     if (isKeyDown('d')) {
//       moveInput.x += 1
//     }

//     if (isKeyDown('a')) {
//       moveInput.x -= 1
//     }

//     if (isKeyDown('w')) {
//       moveInput.y -= 1
//     }

//     if (isKeyDown('s')) {
//       moveInput.y += 1
//     }

//     if (Vector2.mag(moveInput) > 1.0) {
//       moveInput = Vector2.normalize(moveInput)
//     }

//     const mousePos = getMousePos()
//     const lookRot = Math.atan2(
//       mousePos.y - this.position.y,
//       mousePos.x - this.position.x
//     )

//     this.moveInput = moveInput
//     this.lookRot = lookRot
//   }


//   public tick(delta: number, currentTime: number): void {
//     if (this.isLocalPlayer) {
//       this.pollInput()

//       this.inputs.push({
//         moveInput: this.moveInput,
//         lookRot: this.lookRot,
//         id: this.inputSeq,
//         delta: delta
//       })

//       this.inputSeq++;
//       if (!Number.isSafeInteger(this.inputSeq)) {
//         this.inputSeq = 0
//       }

//       const latestServerUpdate = this.serverUpdates[this.serverUpdates.length - 1]

//       if (this.lastServerInput < latestServerUpdate.lastInputProcessed) {
//         this.lastServerInput = latestServerUpdate.lastInputProcessed
//         this.inputs = this.inputs.filter((input) => {
//           return latestServerUpdate.lastInputProcessed < input.id;
//         })

//         this.position.x = latestServerUpdate.position.x
//         this.position.y = latestServerUpdate.position.y
//         this.rotation = latestServerUpdate.rotation

//         const currentAcceleration = this.acceleration

//         this.acceleration = currentAcceleration
//       }
//     } else {
//       let lastUpdate;
//       let targetUpdate;

//       for (let i = 0; i < this.serverUpdates.length - 1; i++) {
//         const tempLast = this.serverUpdates[i]
//         const tempTarget = this.serverUpdates[i + 1]

//         if (currentTime >= tempLast.time && currentTime <= tempTarget.time) {
//           lastUpdate = tempLast
//           targetUpdate = tempTarget
//           break
//         }
//       }

//       if (lastUpdate && targetUpdate) {
//         const difference = targetUpdate.time - currentTime;
//         const maxDiff = (targetUpdate.time - lastUpdate.time)
//         const timePoint = ((maxDiff - difference) / maxDiff)

//         const pos = { x: 0, y: 0 }
//         let rot = 0

//         pos.x = GameMath.lerp(lastUpdate.position.x, targetUpdate.position.x, timePoint)
//         pos.y = GameMath.lerp(lastUpdate.position.y, targetUpdate.position.y, timePoint)
//         rot = GameMath.lerp(lastUpdate.rotation, targetUpdate.rotation, timePoint)

//         //client smoothing
//         this.position.x = GameMath.lerp(this.position.x, pos.x, this.clientSmoothing * delta)
//         this.position.y = GameMath.lerp(this.position.y, pos.y, this.clientSmoothing * delta)
//         this.rotation = GameMath.lerp(this.rotation, rot, this.clientSmoothing * delta)
//       }
//     }
//   }
// }

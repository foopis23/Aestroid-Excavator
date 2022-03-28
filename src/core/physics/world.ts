import { isCircleVsCircleCollision, resolveCircleVsCircleCollision } from './physics'
import { IPhysicsBody } from "./body"

export interface IPhysicsWorld {
  readonly bodies: Record<string, IPhysicsBody>
  tick(delta: number): void
  add(id: string, body: IPhysicsBody): void
  remove(id: string): void
}

export class PhysicsWorld implements IPhysicsWorld {
  public readonly bodies: Record<string, IPhysicsBody>

  constructor() {
    this.bodies = {}
  }

  public add(id: string, body: IPhysicsBody) {
    this.bodies[id] = body
  }

  public remove(id: string) {
    delete this.bodies[id]
  }

  public tick(delta: number) {
    for (const phyBody of Object.values(this.bodies)) {
      const drag = {
        x: phyBody.dragScale * phyBody.velocity.x ** 2 * Math.sign(phyBody.velocity.x),
        y: phyBody.dragScale * phyBody.velocity.y ** 2 * Math.sign(phyBody.velocity.y)
      }
    
      phyBody.acceleration.x -= drag.x * delta
      phyBody.acceleration.y -= drag.y * delta
    
      phyBody.velocity.x += phyBody.acceleration.x * delta
      phyBody.velocity.y += phyBody.acceleration.y * delta
    
      if (Math.abs(phyBody.velocity.x) < 0.04) {
        phyBody.velocity.x = 0
      }
    
      if (Math.abs(phyBody.velocity.y) < 0.04) {
        phyBody.velocity.y = 0
      }
    
      phyBody.position.x += phyBody.velocity.x * delta
      phyBody.position.y += phyBody.velocity.y * delta
    
      // Check For collision with all bodies
      for (const body of Object.values(this.bodies)) {
        if (body !== phyBody) {
          const colliding = isCircleVsCircleCollision(
            phyBody.position,
            body.position,
            phyBody.radius,
            body.radius)
    
          if (colliding) {
            phyBody.position = resolveCircleVsCircleCollision(
              phyBody,
              body
            )
          }
        }
      }  
    }
  }
}

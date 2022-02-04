import './style.css'
import * as PIXI from 'pixi.js'
import { isKeyDown } from './input'
import { PhysicsBody, PhysicsWorld } from './phyiscs'
import { mathv2 } from './vector2'

const PLAYER_ACCELERATION = 0.1

const app = new PIXI.Application()

document.body.appendChild(app.view)

const world: PhysicsWorld = { bodies: [] }

class Player extends PhysicsBody {
  public override tick (delta: number): void {
    let input = { x: 0, y: 0 }

    if (isKeyDown('d')) {
      input.x += 1
    }

    if (isKeyDown('a')) {
      input.x -= 1
    }

    if (isKeyDown('w')) {
      input.y -= 1
    }

    if (isKeyDown('s')) {
      input.y += 1
    }

    if (mathv2.length(input) > 1.0) {
      input = mathv2.normalize(input)
    }

    this.acceleration.x = input.x * PLAYER_ACCELERATION * delta
    this.acceleration.y = input.y * PLAYER_ACCELERATION * delta

    super.tick(delta, world)
  }
}

const player = new Player(100)
player.addChild(
  new PIXI.Graphics()
    .beginFill(0x00ff00)
    .drawPolygon([new PIXI.Point(0, 0), new PIXI.Point(50, 100), new PIXI.Point(-50, 100)])
)
player.position.x = 100
app.stage.addChild(player)
world.bodies.push(player)

app.ticker.add((delta: number) => {
  player.tick(delta)
})

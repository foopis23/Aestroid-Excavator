import './style.css'
import * as PIXI from 'pixi.js'
import { isKeyDown, useMousePos } from './input'
import { PhysicsBody, PhysicsWorld } from './phyiscs'
import { mathv2 } from './vector2'

const PLAYER_ACCELERATION = 1

const app = new PIXI.Application()
const { getMousePos } = useMousePos(app.stage)

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

    const pos = getMousePos()
    const rot = Math.atan2(pos.y - this.position.y, pos.x - this.position.x)
    this.rotation = rot

    super.tick(delta, world)
  }
}

const player = new Player(20)
player.addChild(
  new PIXI.Graphics()
    .beginFill(0x00ff00)
    .drawPolygon([new PIXI.Point(0, 0), new PIXI.Point(1, 0.5), new PIXI.Point(0, 1)])
)
player.pivot.x = 0.5
player.pivot.y = 0.5
player.scale.x = 30
player.scale.y = 30
player.position.x = 100
app.stage.interactive = true
app.stage.addChild(player)


const otherBody = new PhysicsBody(30)
otherBody.addChild(new PIXI.Graphics().beginFill(0xffffff).drawCircle(0, 0, 30))
otherBody.position.x = 200
otherBody.position.y = 200

app.stage.addChild(otherBody)
world.bodies.push(otherBody)
world.bodies.push(player)

app.ticker.add((delta: number) => {
  player.tick(delta)
})

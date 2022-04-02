import './style.css'

import { Application, Graphics, Point, settings, Text } from 'pixi.js'
import { ECS } from '../core/ecs'
import { CollisionSystem, PhysicsSystem, PlayerInputHandlerSystem } from '../core/systems'

import { ComponentTypes } from '../core/components'
import { PollInputSystem } from './poll-input-system'
import { GraphicsSystem } from './graphics-system'
const TARGET_FPMS = settings.TARGET_FPMS ?? 0.06

const app = new Application({
  width: window.innerWidth,
  height: window.innerHeight,
})
app.stage.interactive = true
document.body.appendChild(app.view)

const ecs = new ECS(
  new PollInputSystem(app),
  PlayerInputHandlerSystem,
  PhysicsSystem,
  CollisionSystem,
  GraphicsSystem
)

const playerGraphics = new Graphics()
  .beginFill(0x00ff00)
  .drawPolygon([new Point(0, 0), new Point(1, 0.5), new Point(0, 1)])

playerGraphics.scale.x = 30
playerGraphics.scale.y = 30
playerGraphics.pivot.x = 0.5
playerGraphics.pivot.y = 0.5

app.stage.addChild(playerGraphics)

const localPlayer = ecs.createNewEntity(
  {
    position: { x: 200, y: 200 },
    isLocalPlayer: true,
    graphics: playerGraphics,
    static: false,
    maxAcceleration: 2000
  },
  [
    ComponentTypes.Transform,
    ComponentTypes.RigidBody,
    ComponentTypes.Graphics,
    ComponentTypes.PlayerInput,
    ComponentTypes.LocalPlayer,
    ComponentTypes.Collider
  ]
)

const debugMenuText = new Text('', { fontSize: '12px', fill: '#ffffff' })
app.stage.addChild(debugMenuText)

app.ticker.add((deltaFrame: number) => {
  const delta = (deltaFrame / TARGET_FPMS) / 1000
  ecs.update(delta)

  const playersComponent = ecs.entityData[localPlayer.id]

  debugMenuText.text = JSON.stringify(playersComponent, (key, value) => (key == 'graphics')? '...' : value, 2)
})
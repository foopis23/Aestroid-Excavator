import './style.css'

import { Application, Graphics, Point, settings, Text } from 'pixi.js'
import { ECS } from '../core/ecs'
import { BoundsSystem, CollisionSystem, PhysicsSystem, PlayerInputHandlerSystem } from '../core/systems'

import { ComponentTypes } from '../core/components'
import { PollInputSystem } from './poll-input-system'
import { GraphicsSystem } from './graphics-system'
const TARGET_FPMS = settings.TARGET_FPMS ?? 0.06

const debugMenuText = new Text('', { fontSize: '12px', fill: '#ffffff' })
const baseResolution = {
  x: 1440,
  y: 1080
}

function resizeWindow() {
  const scale = Math.min(window.innerWidth / baseResolution.x, window.innerHeight / baseResolution.y)
  app.renderer.resize(scale * baseResolution.x, scale * baseResolution.y)
  app.stage.scale.x = scale
  app.stage.scale.y = scale
  debugMenuText.resolution = scale
}

const app = new Application({
  width: 1,
  height: 1
})
app.stage.interactive = true
resizeWindow()
document.body.appendChild(app.view)

let windowResizeTimeout: NodeJS.Timeout | null = null;
window.onresize = () => {
  clearTimeout(windowResizeTimeout)
  windowResizeTimeout = setTimeout(resizeWindow, 200)
}

const ecs = new ECS(
  new PollInputSystem(app),
  PlayerInputHandlerSystem,
  PhysicsSystem,
  CollisionSystem,
  new BoundsSystem({x: 0, y: 0, w: baseResolution.x,h: baseResolution.y}),
  GraphicsSystem
)

const playerGraphics = new Graphics()
  .lineStyle(2, 0x00ff00)
  .drawPolygon([new Point(0, 0), new Point(30, 15), new Point(0, 30)])

playerGraphics.pivot.x = 15
playerGraphics.pivot.y = 15

app.stage.addChild(playerGraphics)

const localPlayer = ecs.createNewEntity(
  {
    position: { x: 200, y: 200 },
    isLocalPlayer: true,
    graphics: playerGraphics,
    static: false,
    maxAcceleration: 1000,
    type: 'circle'
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

for (let i = 0; i < 20; i++) {
  const points = []
  const numPoints = Math.random() * 6 + 4
  const maxRadius = (Math.random() * 60) + 20
  let trueRadius = 0
  for (let p=0; p<numPoints; p++) {
    const angle = p * Math.PI * 2 / numPoints
    const distance = (Math.random() * (maxRadius - (maxRadius * 0.5))) + (maxRadius * 0.5)
    points.push(new Point(Math.cos(angle) * distance, Math.sin(angle) * distance))
    if (trueRadius < distance) {
      trueRadius = distance
    }
  }
  const asteroidGraphics = new Graphics()
    .lineStyle(2, 0xffffff)
    .drawPolygon(points)

  asteroidGraphics.pivot.x = 0.5
  asteroidGraphics.pivot.y = 0.5

  app.stage.addChild(asteroidGraphics)

  ecs.createNewEntity(
    {
      position: { x: Math.random() * baseResolution.x, y: Math.random() * baseResolution.y },
      graphics: asteroidGraphics,
      static: false,
      maxAcceleration: 1000,
      size: { x: trueRadius, y: trueRadius },
      hasDrag: false,
      velocity: { x: Math.random() * 10, y: Math.random() * 10},
      type: 'circle'
    },
    [
      ComponentTypes.Transform,
      ComponentTypes.RigidBody,
      ComponentTypes.Graphics,
      ComponentTypes.Collider
    ]
  )
}


app.stage.addChild(debugMenuText)

app.ticker.add((deltaFrame: number) => {
  const delta = (deltaFrame / TARGET_FPMS) / 1000
  ecs.update(delta)

  const playersComponent = ecs.entityData[localPlayer.id]

  debugMenuText.text = JSON.stringify(playersComponent, (key, value) => (key == 'graphics') ? '...' : value, 2)
})
import './style.css'

import { COLOR_SCHEME, BASE_RESOLUTION } from './config'

import { Application, Graphics, Point, settings } from 'pixi.js'
import { ECS } from '../core/ecs'
import { BoundsSystem, CollisionSystem, PhysicsSystem, PlayerInputHandlerSystem } from '../core/systems'

import { ComponentTypes } from '../core/components'
import { GraphicsSystem, PollInputSystem } from './systems'
import { createPlayer } from './player'
import { useAppScaler } from './window'

const TARGET_FPMS = settings.TARGET_FPMS ?? 0.06


const app = new Application({
  width: 1,
  height: 1,
  backgroundColor: COLOR_SCHEME.background
})
app.stage.interactive = true
useAppScaler(app)
document.body.appendChild(app.view)

const ecs = new ECS(
  new PollInputSystem(app),
  PlayerInputHandlerSystem,
  PhysicsSystem,
  CollisionSystem,
  new BoundsSystem({ x: 0, y: 0, w: BASE_RESOLUTION.x, h: BASE_RESOLUTION.y }),
  GraphicsSystem
)

createPlayer(app, ecs, COLOR_SCHEME.team1, true, { x: BASE_RESOLUTION.x / 2, y: BASE_RESOLUTION.y / 2 })
createPlayer(app, ecs, COLOR_SCHEME.team2, false, { x: 100, y: 100 })

for (let i = 0; i < 20; i++) {
  const points = []
  const numPoints = Math.random() * 6 + 4
  const maxRadius = (Math.random() * 60) + 20
  let trueRadius = 0
  for (let p = 0; p < numPoints; p++) {
    const angle = p * Math.PI * 2 / numPoints
    const distance = (Math.random() * (maxRadius - (maxRadius * 0.5))) + (maxRadius * 0.5)
    points.push(new Point(Math.cos(angle) * distance, Math.sin(angle) * distance))
    if (trueRadius < distance) {
      trueRadius = distance
    }
  }
  const asteroidGraphics = new Graphics()
    .lineStyle(3, COLOR_SCHEME.asteroid)
    .drawPolygon(points)

  asteroidGraphics.pivot.x = 0.5
  asteroidGraphics.pivot.y = 0.5

  app.stage.addChild(asteroidGraphics)

  ecs.createNewEntity(
    {
      position: { x: Math.random() * BASE_RESOLUTION.x, y: Math.random() * BASE_RESOLUTION.y },
      graphics: asteroidGraphics,
      static: false,
      maxAcceleration: 1000,
      size: { x: trueRadius, y: trueRadius },
      hasDrag: false,
      velocity: { x: Math.random() * 20 - 10, y: Math.random() * 20 - 10 },
      type: 'circle',
      priority: trueRadius
    },
    [
      ComponentTypes.Transform,
      ComponentTypes.RigidBody,
      ComponentTypes.Graphics,
      ComponentTypes.Collider,
      ComponentTypes.TransformSync
    ]
  )
}

app.ticker.add((deltaFrame: number) => {
  const delta = (deltaFrame / TARGET_FPMS) / 1000
  ecs.update(delta)
})
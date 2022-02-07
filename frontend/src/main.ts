import './style.css'
import * as PIXI from 'pixi.js'
import { isKeyDown, useMousePos } from './input'
import { mathv2, Vector2 } from '../../core/vector2'
import { io } from "socket.io-client";

const app = new PIXI.Application()
const { getMousePos } = useMousePos(app.stage)
app.stage.interactive = true

document.body.appendChild(app.view)
const players : Record<string, Player> = {}

interface PlayerNetworkData {
  id: string,
  position: Vector2,
  rotation: number
}

class Player extends PIXI.Container {
  constructor() {
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
  }

  public tick(delta: number): void {
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
    const lookRot = Math.atan2(mousePos.y - this.position.y, mousePos.x - this.position.x)
    socket.emit('playerInput', {moveInput, lookRot})
  }
}

const socket = io("ws://localhost:3001");
socket.on("connect", () => {
  console.log(socket.id); // x8WIv7-mJelg7on_ALbx
});

socket.on('playerJoin', (id : string) => {
  players[id] = new Player()
  app.stage.addChild(players[id])
})

socket.on('playerLeft', (id: string) => {
  app.stage.removeChild(players[id])
  delete players[id]
})

socket.on('playersSync', (data : PlayerNetworkData[]) => {
  for (const playerData of data) {
    const { id, position, rotation } = playerData
    
    if (players[id] == undefined) {
      players[id] = new Player()
      app.stage.addChild(players[id])
    }

    players[id].position.x = position.x
    players[id].position.y = position.y
    players[id].rotation = rotation
  }
})

app.ticker.add((delta: number) => {
  // console.log(delta)
  for (let playerId of Object.keys(players)) {
    if (playerId == socket.id) {
      players[playerId].tick(delta)
    }
  }
})

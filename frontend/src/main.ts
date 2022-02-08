import './style.css'
import * as PIXI from 'pixi.js'
import { isKeyDown, useMousePos } from './input'
import { mathv2, Vector2 } from '../../core/vector2'
import { io } from "socket.io-client";
import { lerp } from '../../core/util'

const host = prompt('Enter Host Address')
const players : Record<string, Player> = {}
const clientDelay = 100
const fps = 60
const bufferSize = 30
let serverTime = 0.1;
let clientTime = 0.1;

const app = new PIXI.Application()
app.stage.interactive = true
const { getMousePos } = useMousePos(app.stage)
document.body.appendChild(app.view)

interface PlayerNetworkData {
  id: string,
  position: Vector2,
  rotation: number
}

interface PlayerUpdateQueueData extends PlayerNetworkData {
  time: number
}

interface PlayerSyncPacket {
  players: PlayerNetworkData[]
  time: number
}

class Player extends PIXI.Container {
  public serverUpdates : PlayerUpdateQueueData[];

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
    this.serverUpdates = []
  }

  public tick(delta: number): void {
    let currentTime = clientTime;
    let lastUpdate;
    let targetUpdate;

    for (let i=0; i < this.serverUpdates.length -1; i++) {
      let tempLast = this.serverUpdates[i]
      let tempTarget = this.serverUpdates[i+1]

      if (currentTime > tempLast.time && currentTime <= tempTarget.time) {
        lastUpdate = tempLast
        targetUpdate = tempTarget
        break
      }
    }

    if (lastUpdate && targetUpdate) {
      let step = (targetUpdate.time - currentTime) / (targetUpdate.time - lastUpdate.time)
      let pos = {x: 0, y: 0}
      let rot = 0
      pos.x = lerp(lastUpdate.position.x, targetUpdate.position.x, step )
      pos.y = lerp(lastUpdate.position.y, targetUpdate.position.y, step )
      rot = lerp(lastUpdate.rotation, targetUpdate.rotation, step)
      
      //client smoothing
      this.position.x = lerp(this.position.x, pos.x, 25 * 0.016 * delta)
      this.position.y = lerp(this.position.y, pos.y, 25 * 0.016 * delta)
      this.rotation = lerp(this.rotation, rot, 25 * 0.016 * delta)
    }
  }
}

const socket = io(`ws://${host}`);
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

socket.on('playersSync', (data : PlayerSyncPacket) => {
  serverTime = data.time
  clientTime = serverTime - clientDelay

  for (const playerData of data.players) {
    const { id } = playerData
    
    if (players[id] == undefined) {
      players[id] = new Player()
      app.stage.addChild(players[id])
    }

    players[id].serverUpdates.push({...playerData, time: data.time})

    if (players[id].serverUpdates.length > bufferSize * fps) {
      players[id].serverUpdates.splice(0,1)
    }
  }
})

app.ticker.add((delta: number) => {
  if (players[socket.id]) {
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
    const lookRot = Math.atan2(mousePos.y - players[socket.id].position.y, mousePos.x - players[socket.id].position.x)
    socket.emit('playerInput', {moveInput, lookRot})
  }

  // console.log(delta)
  for (let playerId of Object.keys(players)) {
      players[playerId].tick(delta)
  }
})

import { Application } from "pixi.js";
import { Game } from "../core/game";
import { ClientPlayerEntity } from "./player";
import { GameSocket } from "./types";

export class GameClient {
  public static readonly ClIENT_DELAY = 100
  public static readonly CLIENT_SMOOTHING = 7

  constructor(protected game: Game, protected socket: GameSocket, protected app: Application) {
    socket.on("connect", () => {
      // console.log(socket.id); // x8WIv7-mJelg7on_ALbx
    });

    socket.on('playerJoin', (id) => {
      const player = new ClientPlayerEntity(this.app, GameClient.CLIENT_SMOOTHING, id, id == socket.id)
      game.onPlayerJoin(player)
      app.stage.addChild(player)
    })

    socket.on('playerLeft', (id) => {
      app.stage.removeChild(game.players[id] as ClientPlayerEntity)
      game.onPlayerLeave(id)
    })

    socket.on('playersSync', (data) => {
      socket.serverTime = data.time
      socket.clientTime = socket.serverTime - GameClient.ClIENT_DELAY
      socket.lastPacketTime = Date.now()

      for (const playerData of data.players) {
        const { id } = playerData

        if (game.players[id] == undefined) {
          // continue;
          const newPlayer = new ClientPlayerEntity(this.app, GameClient.CLIENT_SMOOTHING, id, id == socket.id)
          game.onPlayerJoin(newPlayer)
          app.stage.addChild(newPlayer)
        }

        const player = game.players[id] as ClientPlayerEntity

        player.serverUpdates.push({ ...playerData, time: data.time })

        while (player.serverUpdates[0].time < socket.clientTime
          && player.serverUpdates[1].time < socket.clientTime) {
          player.serverUpdates.splice(0, 1)
        }
      }
    })
  }
}
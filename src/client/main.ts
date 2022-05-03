import './style.css'
import io, { Socket } from 'socket.io-client'
import { createApp } from '../../node_modules/petite-vue/dist/petite-vue.es'

let socket: Socket | null = null;
const matchMakingUrl = import.meta.env.VITE_MATCH_MAKING_URL as string ?? 'wss://0.matchmaking.asteroidexcavator.net:10500';

const app = createApp({
  state: 'connecting',
  roomId: null,
  baseURL: window.location.href,
  afterGameReport: null,
  online: false,

  mounted() {
    socket = io(matchMakingUrl, {
      reconnectionAttempts: 3
    })

    socket.io.on("reconnect_failed", () => {
      alert('Failed to connected to Matchmaking Service!')
      this.state = 'main-menu';
      this.online = false
    })

    socket.on('connect', () => this.onConnected())
    socket.on('room-created', (roomId) => this.onRoomCreated(roomId))
    socket.on('room-joined', (roomId) => this.onRoomJoined(roomId))
    socket.on('players-found', () => this.onPlayersFound())
    socket.on('game-server-found', (gs) => this.onGameServerFound(gs))
    socket.on('room-full', () => this.onRoomFull())
    socket.on('room-not-found', () => this.onRoomNotFound()),
    socket.on('game-server-not-found', () => this.onGameServerNotFound())

    const rawReport = window.localStorage.getItem('afterGameReport')
    const lastPlayerId = window.localStorage.getItem('lastPlayerId')
    if (rawReport != null && rawReport.length > 0 && lastPlayerId != null && lastPlayerId.length > 0) {
      this.afterGameReport = JSON.parse(rawReport)
      this.lastPlayerId = parseInt(lastPlayerId)
    }
  },
  createRoom() {
    if (!socket) {
      return;
    }
    this.state = 'creating-room'
    socket.emit('create-room');
  },
  joinRoom() {
    const response = prompt('Enter room id:')
    if (response === null) return

    if (!socket) {
      return;
    }
    this.state = 'joining-room'

    socket.emit('join-room', response);
  },
  joinRoomWithCode(code) {
    if (!socket) {
      return;
    }
    this.state = 'joining-room'

    socket.emit('join-room', code);
  },
  onConnected() {
    console.log('connected')
    this.state = 'main-menu'
    this.online = true

    const url = new URL(window.location.href);
    for (const [key, value] of url.searchParams) {
      if (key === 'roomId') {
        this.joinRoomWithCode(value)
        window.history.replaceState({}, document.title, "/");
        return
      }
    }
    
    if (this.afterGameReport) {
      this.state = 'after-game-report'
      return
    }
  },
  onRoomCreated(roomId: string) {
    this.roomId = roomId
    this.state = 'waiting-for-players'
  },
  onRoomJoined(roomId: string) {
    this.roomId = roomId
    this.state = 'waiting-for-players'
  },
  onPlayersFound() {
    this.state = 'waiting-for-game-server'
  },
  onGameServerFound(gs) {
    this.state = 'in-game'
    new ClientEngine(gs.status.address, 'wss', gs.status.ports[0].port)
  },
  directConnect() {
    const response = prompt('Enter game server address:')
    if (response === null) return
    const [host, port] = response.split(':')
    const portNum = parseInt(port);
    if (isNaN(portNum)) {
      return;
    }

    this.state = 'in-game',
      new ClientEngine(host, 'wss', portNum)
  },
  copyToClipboard(e) {
    const buttonEl = e.target as HTMLButtonElement;
    const value = buttonEl.getAttribute('data-copy');
    if (!value) {
      return;
    }

    navigator.clipboard.writeText(value);
    buttonEl.innerText = 'Copied'
    setTimeout(() => {
      buttonEl.innerText = 'Copy'
    }, 1000)
  },
  exitAfterGameReport() {
    this.state = 'main-menu'
    this.afterGameReport = null
    window.localStorage.removeItem('afterGameReport')
  },
  onRoomFull() {
    this.state = 'room-full'
    alert('❗❗Room is full❗❗')
    this.state = 'main-menu'
    this.room = null
  },
  onRoomNotFound() {
    this.state = 'room-not-found'
    alert('❗❗Room not found❗❗')
    this.state = 'main-menu'
    this.room = null
  },
  onGameServerNotFound() {
    this.state = 'game-server-not-found'
    alert('❗❗Game server not found❗❗')
    this.state = 'main-menu'
    this.room = null
  },
  getWonText() {
    if (this.afterGameReport == null) {
      return ''
    }

    const winner = this.afterGameReport.reduce((winner, curr) => {
      if (curr.score > winner.score) {
        return curr
      }
      return winner
    }, this.afterGameReport[0])

    const isTie = this.afterGameReport.every(player => player.score === winner.score)

    if (isTie) {
      return 'Tie!'
    }

    if (winner.entityId === this.lastPlayerId) {
      return 'You won!'
    } else {
      return `You lost...`
    }
  }
});

app.mount();

import { ClientEngine } from './client-engine'

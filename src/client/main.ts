import './style.css'
import io, { Socket } from 'socket.io-client'
import { createApp } from '../../node_modules/petite-vue/dist/petite-vue.es'

let socket: Socket | null = null;

const app = createApp({
  state: 'connecting',
  roomId: null,
  baseURL: window.location.href,
  mounted() {
    socket = io('ws://localhost:8000')
    socket.on('connect', () => this.onConnected())
    socket.on('room-created', (roomId) => this.onRoomCreated(roomId))
    socket.on('room-joined', (roomId) => this.onRoomJoined(roomId))
    socket.on('players-found', () => this.onPlayersFound())
    socket.on('game-server-found', (gs) => this.onGameServerFound(gs))
    socket.on('room-full', () => this.onRoomFull())
    socket.on('room-not-found', () => this.onRoomNotFound()),
    socket.on('game-server-not-found', () => this.onGameServerNotFound())
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

    const url = new URL(window.location.href);
    url.searchParams.forEach((value, key) => {
      if (key === 'roomId') {
        this.joinRoomWithCode(value)
      }
    })
    window.history.replaceState({}, document.title, "/");
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
    new ClientEngine(gs.status.address, 'ws', gs.status.ports[0].port)
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
      new ClientEngine(host, 'ws', portNum)
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
  }
});

app.mount();

import { ClientEngine } from './client-engine'

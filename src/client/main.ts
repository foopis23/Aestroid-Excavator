import './style.css'

import { ClientEngine } from './client-engine'

function start() {
  const location = prompt('Enter IP:PORT')
  if (location == null) {
    return
  }

  const [ip, port] = location.split(':')
  const portNum = parseInt(port)

  if (isNaN(portNum)) {
    alert('Invalid IP:PORT')
    return
  }
  
  const el = document.getElementById('main-menu');
  if (el) {
    el.style.display = 'none'
  }

  new ClientEngine(ip, 'ws', portNum)
}

document.getElementById('start-button')?.addEventListener('click', start)
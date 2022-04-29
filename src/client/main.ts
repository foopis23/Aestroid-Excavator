import './style.css'

import { ClientEngine } from './client-engine'

function start() {
  const el = document.getElementById('main-menu');
  if (el) {
    el.style.display = 'none'
  }
  new ClientEngine('localhost', 'ws', 9500)
}

document.getElementById('start-button')?.addEventListener('click', start)
import './style.css'

import { ClientEngine } from './client-engine'

new ClientEngine('localhost', 9500, 'ws')

// eslint-disable-next-line @typescript-eslint/no-var-requires
require(`dotenv-defaults`).config({
  path: './.env',
  encoding: 'utf8',
  defaults: './.env.defaults' // This is new
})

import { getFloatFromEnv, getIntFromEnv } from './config';
import { ServerEngine } from './server-engine'

// config
const port = getIntFromEnv('PORT', 9500);
const origin = process.env.CORS_URL
const maxPlayers = getIntFromEnv('MAX_PLAYERS', 2)
const serverTickRate = getFloatFromEnv('SERVER_TICK_RATE', 1000 / 60)

// create server
new ServerEngine(port, origin, maxPlayers, serverTickRate)
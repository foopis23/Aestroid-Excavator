# Aestroid-Excavator
A WIP multiplayer game written in typescript with pixi.js and websockets

## Server Status
I shutdown the game servers because it was costing me a furtune. I did this project as a learning experience and payed for all the google cloud infastructure out of pocket. For anyone who did play the demo, I hope you enjoyed it. Thank you.

## Envoirnment
Node: 16.14.2<br>
Browser: Chrome

## Quick Start
1. run `npm install`
2. To start the client run `npm run dev-client`
3. To start the server run `npm run dev-server`

## Build and Run Production Build
1. run `npm install`
2. run `npm run build-client && npm run build-server`
3. to start server run `node dist/server/server/index.js`
4. to start client, use `dist/client/` as the root directory of a web server


## Common Issues
- I normally develop on macOS, but I was working on a windows machine and had issues with nvm. I got a `npm err! unexpected token '.'` error when using npm and npx commands. I don't know what that was about but I just changed my node version and everything works now. Not sure the version numbers are even important but I went from 16.14.2 to 17.0.1.

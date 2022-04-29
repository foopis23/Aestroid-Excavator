FROM node:16-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build-server

CMD [ "node", "dist/server/server/index.js" ]

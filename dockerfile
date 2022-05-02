FROM node:16-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build-server

LABEL org.opencontainers.image.source https://github.com/foopis23/Aestroid-Excavator

CMD [ "node", "dist/server/server/index.js" ]

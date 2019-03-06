FROM node:8

COPY . /app
WORKDIR /app/fabcar/javascript

RUN npm install
RUN npm build

# ATTENTION A BIEN MONTER UN VOLUME VERS HL
WORKDIR /app
CMD ./start_server.sh

FROM node:8

COPY . /app
WORKDIR /app/fabcar/javascript

RUN npm install
RUN npm build

EXPOSE 3000

# ATTENTION A BIEN MONTER UN VOLUME VERS HL
WORKDIR /app
CMD ./start_server.sh

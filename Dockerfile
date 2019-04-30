FROM node:8

ARG SSL_FULLCHAIN
RUN echo "$SSL_FULLCHAIN" > /root/fullchain.pem
ARG SSL_PRIVKEY
RUN echo "$SSL_PRIVKEY" > /root/privkey.pem

COPY . /app
WORKDIR /app/nip/javascript

RUN npm install
RUN npm build

# ATTENTION A BIEN MONTER UN VOLUME VERS HL
WORKDIR /app
CMD ./start_server.sh

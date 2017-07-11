morse-back
==========

_morse-back_ is a work queue for text messages sent from a mobile device to be
processed by a board with a control program from the _morse_ project to convert
text messages to the Morse code to signal tehm through light and sound.

## Requirements

* Node.js, npm `>= 8.1.3`, `>= 5.1.0`
* Redis `>= 3.2.9`
* Docker, docker-compose `>= 17.06.0`, `>= 1.14.0` (optional)

## Interconnection

Ensure that the following host can be resolved into an IP address of the actual
services on your setup

* *morse-queue-db*: resolve to an instance of a Redis database with the queue

There are many approaches that you can use for name resolution. You can add
entries to `/etc/hosts` manually, setup a DNS server or utilize Docker Networks
to manage `/etc/hosts` files across containers automatically.

## Usage

Create an `.env` file with parameters for all the components.

```bash
# Database
MORSE_DATABASE_HOST=the location of the Redis database server (morse-queue-db by default)
MORSE_DATABASE_PORT=the database port (6379 by default)

# Server
MORSE_SERVER_PORT=the port to be used by the server (7474 by default)
```

Install dependencies, ensure that Redis is running, and start the
server.

```bash
npm install # to install dependencies
npm start   # to start the server
```

## Containerization

Instead of setting up the system manually with all its dependencies, you can
also use Docker with Docker Compose to start the service right away.

You can issue the following commands from the project directory

* `docker-compose up`: to start the service

* `docker-compose up -d`: to start the service in the background

* `docker-compose down`: to stop the service

* `docker-compose -f docker-compose.yml -f docker-compose.development.yml`: to
  mount the project directory on the host machine under a project directory
  inside the container to allow instant source changes throughout development
  without rebuilds

## Docker Hub

A prebuilt Docker image can also be found for download from Docker Hub at
[toksaitov/morse-back](https://hub.docker.com/r/toksaitov/morse-back).

## Credits

*morse-back* was created by [Dmitrii Toksaitov](https://github.com/toksaitov).


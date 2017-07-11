const express =
    require('express');
const bodyParser =
    require('body-parser');
const Redis =
    require('ioredis');
const dotenv =
    require('dotenv').config();
const validator =
    require('validator');
const shortid =
    require('shortid');

const serverID =
    shortid.generate();

let databaseHost =
    process.env['MORSE_DATABASE_HOST'];
let databasePort =
    process.env['MORSE_DATABASE_PORT'];

let serverPort =
    process.env['MORSE_SERVER_PORT'];

if (databaseHost == null) {
    databaseHost = 'morse-queue-db';

    console.warn(
        `${serverID}: The database host "MORSE_DATABASE_HOST" is not set in ` +
        `the ".env" file. Assuming the database host is "${databaseHost}".`
    );
}

if (databasePort == null) {
    databasePort = '6379';

    console.warn(
        `${serverID}: The database port "MORSE_DATABASE_PORT" is not set in ` +
        `the ".env" file. Assuming the database port is "${databasePort}".`
    );
}

if (serverPort == null) {
    serverPort = '7474';

    console.warn(
        `${serverID}: The server port "MORSE_SERVER_PORT" is not set in the ` +
        `".env" file. Assuming the server port is "${serverPort}".`
    );
}

const database = new Redis({
    'host': databaseHost,
    'port': databasePort
})

const server = express();

server.use(bodyParser.urlencoded({ 'extended': true }));

server.post('/enqueue', (request, response) => {
    const maximumMessageLength = 32;

    let message =
        request.body['message'];

    if (!message) {
        console.error(`${serverID}: Invalid message '${message}'.`);
        response.status(400).end('Invalid Parameters');

        return;
    }

    if (message.length > maximumMessageLength) {
        console.error(
            `${serverID}: The message has more than ${maximumMessageLength} ` +
            'letters.'
        );
        response.status(400).end('Invalid Message Length');

        return;
    }

    const id =
        shortid.generate();
    message =
        validator.escape(message);

    const entry = JSON.stringify({
        'id': id,
        'message': message
    });

    database.rpush('queue:messages', entry).then(() => {
        console.log(
            `${serverID}: The message '${message}' with the ID '${id}' ` +
            `was added to the work queue at ${new Date()}.`
        );

        response.status(200).end('OK');
    }).catch(error => {
        console.error(
            `${serverID}: Failed to push the message '${message}' with the ID ` +
            `'${id}' to the queue.`
        );
        console.error(error);

        response.status(500).end('Internal Server Error');
    });
});

server.post('/dequeue', (request, response) => {
    database.rpoplpush('queue:messages', 'queue:in-progress').then(entry => {
        if (!entry) {
            console.error(
                `${serverID}: The work queue is empty. Nothing to do.`
            );
            response.status(204).end('No Content');

            return;
        }

        let parsedEntry = null;
        try {
            parsedEntry = JSON.parse(entry);
        } catch(error) {
            console.error(
                `${serverID}: Failed to parse the entry '${entry}' from the ` +
                'queue.'
            );
            console.error(error);

            response.status(500).end('Internal Server Error');

            return;
        }

        parsedEntry['id'] =
            validator.escape(parsedEntry['id'] || '');
        parsedEntry['message'] =
            validator.escape(parsedEntry['message'] || '');

        const id =
            parsedEntry['id']
        const message =
            parsedEntry['message'];

        if (!id) {
            console.error(
                `${serverID}: Got an invalid message ID '${id}' from ` +
                'the queue.'
            );
            response.status(500).end('Internal Server Error');

            return;
        }

        if (!message) {
            console.error(
                `${serverID}: Got an invalid message '${message}' for the ID ` +
                `'${id}' from the queue.`
            );
            response.status(500).end('Internal Server Error');

            return;
        }

        console.log(
            `${serverID}: The message '${message}' with the ID '${id}' was ` +
            `removed from the work queue at ${new Date()}.`
        );

        response.status(200).format({
            'text': () => {
                response.send(`${id},"${message}"`);
            },
            'html': () => {
                response.send(`<p id="${id}">${message}</p>`);
            },
            'json': () => {
                response.json(parsedEntry);
            }
        });
    }).catch(error => {
        console.error(`${serverID}: Failed to get a message from the queue.`);
        console.error(error);

        response.status(500).end('Internal Server Error');
    });
});

server.post('/finish', (request, response) => {
    let id =
        request.body['id'];
    let message =
        request.body['message'];

    if (!id) {
        console.error(`${serverID}: Invalid message ID '${id}'.`);
        response.status(400).end('Invalid Parameters');

        return;
    }

    if (!message) {
        console.error(
            `${serverID}: Invalid message '${message}' for the ID '${id}'.`
        );
        response.status(400).end('Invalid Parameters');

        return;
    }

    const entry = JSON.stringify({
        'id': id,
        'message': message
    });

    database.lrem('queue:messages', 0, entry).then(() => {
        console.log(
            `${serverID}: Removed the work item with the ID '${id}' at ` +
            `${new Date()} from the in-progress queue.`
        );

        response.status(200).end('OK');
    }).catch(error => {
        console.error(
            `${serverID}: Failed to remove the working item with the ID '${id}' ` +
            'from the in-progress queue.'
        );
        console.error(error);

        response.status(500).end('Internal Server Error');
    });
});

server.get('/length', (request, response) => {
    database.llen('queue:messages').then(length => {
        response.status(200).format({
            'text': () => {
                response.send(`${length}`);
            },
            'html': () => {
                response.send(`<p>${length}</p>`);
            },
            'json': () => {
                response.json({
                    'length': length
                });
            }
        });
    }).catch(error => {
        console.error(`${serverID}: Failed to get the length of the message queue.`);
        console.error(error);

        response.status(500).end('Internal Server Error');
    });
});

server.post('/notify', (request, response) => {
    console.log(`${serverID}: Got a message from a device at ${new Date()}: `);
    console.log(request.body);
});

server.listen(serverPort, () => {
    console.log(`${serverID}: The morse server is listening on port ${serverPort}`);
});


#!/usr/bin/env node

/*
 * Module dependencies.
 */
import http from 'http';
import { debug as logger } from 'debug';
import app from './app';

const debug = logger('braintree:server');

/*
 * Get port from environment and store in Express.
 */
const port = normalizePort(process.env.PORT || '3000');

app.set('port', port);

/*
 * Create HTTP server.
 */
const server = http.createServer(app);

/*
 * Listen on provided port, on all network interfaces.
 */
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/*
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val) {
  const parsedPort = parseInt(val, 10);

  if (isNaN(parsedPort)) {
    // named pipe
    return val;
  }

  if (parsedPort >= 0) {
    // port number
    return parsedPort;
  }

  return false;
}

/*
 * Event listener for HTTP server "error" event.
 */
function onError(error) {
  let bind;

  if (error.syscall !== 'listen') {
    throw error;
  }

  bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} requires elevated privileges`); // eslint-disable-line no-console
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`${bind} is already in use`); // eslint-disable-line no-console
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/*
 * Event listener for HTTP server "listening" event.
 */
function onListening() {
  const addr = server.address();
  const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;

  debug(`'Listening on ${bind}`);
}

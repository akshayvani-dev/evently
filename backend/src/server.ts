import { createServer } from 'node:http';
import app from './app';
import { env } from './config/env';
import { prisma } from './lib/prisma';

const server = createServer(app);
let isShuttingDown = false;

server.on('error', (error: NodeJS.ErrnoException) => {
  console.error('Failed to start the HTTP server:', error);
  process.exitCode = 1;
  void prisma.$disconnect().catch((disconnectError: unknown) => {
    console.error('Error while disconnecting from the database:', disconnectError);
  });
});

const startServer = async (): Promise<void> => {
  try {
    await prisma.$connect();
    console.log('Database connected successfully');

    if (isShuttingDown) {
      await prisma.$disconnect();
      return;
    }

    server.listen(env.PORT, () => {
      console.info(`Evently API listening on port ${env.PORT} (${env.NODE_ENV})`);
    });
  } catch (error: unknown) {
    console.error('Failed to start Evently API:', error);
    process.exitCode = 1;
  }
};

const shutdown = (signal: NodeJS.Signals): void => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  console.info(`${signal} received; shutting down gracefully`);

  server.close((serverError) => {
    if (serverError) {
      console.error('Error while closing the HTTP server:', serverError);
      process.exitCode = 1;
    }

    void prisma
      .$disconnect()
      .then(() => {
        console.info('HTTP server and database connections closed');
      })
      .catch((error: unknown) => {
        console.error('Error while disconnecting from the database:', error);
        process.exitCode = 1;
      });
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

void startServer();

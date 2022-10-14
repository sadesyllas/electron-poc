import { createInterface } from 'node:readline';
import * as net from 'net';

export const setupStreams = (
  server: string,
  _: string | undefined,
  callbacks: {
    input: (input: string) => Promise<string>;
    close?: () => void;
    end?: () => void;
    error?: (error: Error) => void;
  }
) => {
  const stream = net.connect(server);

  stream.on(
    'error',
    callbacks.error ??
      (() => {
        // ignore
      })
  );

  stream.on(
    'end',
    callbacks.end ??
      (() => {
        // ignore
      })
  );

  stream.on(
    'close',
    callbacks.close ??
      (() => {
        // ignore
      })
  );

  const rl = createInterface({
    input: stream,
    terminal: false,
  });

  rl.on('line', async (line) => {
    const response = await callbacks.input(line);
    stream.write(`${response}\n`);
  });

  return () => stream.end();
};

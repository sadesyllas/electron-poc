import { createInterface } from 'node:readline';
import * as net from 'net';

export const setupStreams = (
  pipeNameIn: string,
  pipeNameOut: string,
  callbacks: {
    input: (input: string) => Promise<string>;
    close?: () => void;
    end?: () => void;
    error?: (error: Error) => void;
  }
) => {
  const server = net.createServer(function (stream) {
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
  });

  server.listen(pipeNameIn);

  return () => server.close();
};

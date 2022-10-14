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
  let streamIn: net.Socket;
  const streamOut = net.connect(pipeNameOut);

  const server = net.createServer(function (stream) {
    streamIn = stream;

    for (const stream of [streamIn, streamOut]) {
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
    }

    const rl = createInterface({
      input: streamIn,
      terminal: false,
    });

    rl.on('line', async (line) => {
      const response = await callbacks.input(line);
      streamOut.write(`${response}\n`);
    });
  });

  server.listen(pipeNameIn);

  return () => {
    server.close();
    streamOut && streamOut.destroy();
  };
};

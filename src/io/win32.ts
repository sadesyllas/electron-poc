import net from 'node:net';
import { createInterface } from 'node:readline';

export const setupStreams = (
  server: string,
  _: string | undefined,
  callbacks: {
    input: (input: string) => Promise<string>;
    close?: () => void;
    end?: () => void;
    error?: (error: Error) => void;
  },
  after: (err: Error | undefined, cb: (() => void) | undefined) => void
): void => {
  const stream = net.connect(server, () => {
    stream.on('error', callbacks.error ?? ((err) => after(err, undefined)));

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

    after(undefined, () => stream.end());
  });
};

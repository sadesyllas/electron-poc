import fs from 'fs';
import { createInterface } from 'node:readline';

export const setupStreams = (
  pipeNameIn: string,
  pipeNameOut: string | undefined,
  callbacks: {
    input: (input: string) => Promise<string>;
    close?: () => void;
    end?: () => void;
    error?: (error: Error) => void;
  }
) => {
  if (pipeNameOut === undefined) {
    throw new Error(`pipeNameOut must not be undefined in linux`);
  }

  if (!fs.statSync(pipeNameIn, { throwIfNoEntry: false })?.isFIFO()) {
    throw new Error(`${pipeNameIn} is not a named pipe`);
  }

  if (!fs.statSync(pipeNameOut, { throwIfNoEntry: false })?.isFIFO()) {
    throw new Error(`${pipeNameIn} is not a named pipe`);
  }

  const fdIn = fs.openSync(pipeNameIn, fs.constants.O_RDONLY);
  const streamIn = fs.createReadStream('', { fd: fdIn, autoClose: false, encoding: 'utf8' });
  const fdOut = fs.openSync(pipeNameOut, fs.constants.O_WRONLY);
  const streamOut = fs.createWriteStream('', { fd: fdOut, autoClose: false, encoding: 'utf8' });

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

  return () => {
    streamIn && streamIn.close();
    streamOut && streamOut.close();
  };
};

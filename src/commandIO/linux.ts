import fs from 'node:fs';
import { createInterface } from 'node:readline';

export const setupStreams = (
  pipeNameIn: string,
  pipeNameOut: string | undefined,
  callbacks: {
    input: (input: string) => Promise<string>;
    close?: () => void;
    end?: () => void;
    error?: (error: Error) => void;
  },
  after: (err: Error | undefined, cb: (() => void) | undefined) => void
): void => {
  if (pipeNameOut === undefined) {
    after(new Error(`pipeNameOut must not be undefined in linux`), undefined);
    return;
  }

  Promise.all([
    setupPipe(pipeNameIn, fs.constants.O_RDONLY, callbacks),
    setupPipe(pipeNameOut, fs.constants.O_WRONLY, callbacks),
  ]).then(
    ([streamIn, streamOut]) => {
      const rl = createInterface({
        input: <fs.ReadStream>streamIn,
        terminal: false,
      });

      rl.on('line', async (line) => {
        const response = await callbacks.input(line);
        (<fs.WriteStream>streamOut).write(`${response}\n`);
      });

      after(undefined, () => {
        streamIn && streamIn.close();
        streamOut && streamOut.close();
      });
    },
    (err) => after(err, undefined)
  );
};

const setupPipe = async (
  pipeName: string,
  mode: number,
  callbacks: {
    input: (input: string) => Promise<string>;
    close?: () => void;
    end?: () => void;
    error?: (error: Error) => void;
  }
): Promise<fs.ReadStream | fs.WriteStream> =>
  new Promise((resolve, reject) => {
    fs.stat(pipeName, (err, stats) => {
      if (err) {
        return reject(err);
      }

      if (!stats.isFIFO()) {
        return reject(new Error(`${pipeName} is not a named pipe`));
      }

      fs.open(pipeName, mode, (err, fd) => {
        if (err) {
          return reject(err);
        }

        const stream =
          mode === fs.constants.O_RDONLY
            ? fs.createReadStream('', { fd, autoClose: false, encoding: 'utf8' })
            : fs.createWriteStream('', { fd, autoClose: false, encoding: 'utf8' });

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

        resolve(stream);
      });
    });
  });

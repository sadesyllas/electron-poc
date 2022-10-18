import { app, BrowserWindow, session } from 'electron';
import * as path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { getStreamsSetupFunction } from './commandIO';

const setupStreams = getStreamsSetupFunction();
let streamsCloser: (() => void) | undefined;

let win: BrowserWindow;

const createWindow = () => {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // noinspection JSIgnoredPromiseFromCall
  win.loadFile('index.html');
  win.webContents.openDevTools();
};

const wireUpApp = () => {
  app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });

    session.defaultSession.webRequest.onHeadersReceived((details, callback) =>
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': ["script-src 'self'"],
        },
      })
    );
  });

  app.on('window-all-closed', () => {
    if (process.platform === 'darwin') {
      return;
    }

    try {
      if (streamsCloser) {
        streamsCloser();
      }
    } catch (_) {
      // ignore
    }

    app.quit();
  });
};

(async () => {
  let parser = yargs(hideBin(process.argv)).help('h');

  if (process.platform === 'win32') {
    parser = parser.option('server', {
      requiresArg: true,
      type: 'string',
      demandOption: true,
    });
  } else {
    parser = parser
      .option('in', {
        requiresArg: true,
        type: 'string',
        demandOption: true,
      })
      .option('out', {
        requiresArg: true,
        type: 'string',
        demandOption: true,
      });
  }

  const argv = await parser.argv;

  const sendToRenderer = (event: string, args?: unknown) => {
    try {
      win?.webContents.send(event, args);
    } catch (_) {
      // ignore
    }
  };

  wireUpApp();

  setupStreams(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    argv.in ?? argv.server,
    argv.out,
    {
      input: (input) => {
        win?.webContents.send('input', input);
        return Promise.resolve(input);
      },
      end: () => sendToRenderer('io.end'),
      close: () => sendToRenderer('io.close'),
      error: (error: Error) => sendToRenderer('io.error', error),
    },
    (err, cb) => {
      if (err) {
        throw err;
      }

      streamsCloser = cb;
    }
  );
})();

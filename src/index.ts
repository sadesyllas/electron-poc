import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { getStreamsSetupFunction } from './commandIO';

const setupStreams = getStreamsSetupFunction();
let streamsCloser: () => void;

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

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  streamsCloser = setupStreams(argv.in ?? argv.server, undefined, {
    input: (input) => {
      win?.webContents.send('input', input);
      return Promise.resolve(input);
    },
    end: () => (win?.webContents.isDestroyed() ? null : win?.webContents.send('io.end')),
    close: () => (win?.webContents.isDestroyed() ? null : win?.webContents.send('io.close')),
    error: (error: Error) => (win?.webContents.isDestroyed() ? null : win?.webContents.send('io.error', error)),
  });

  wireUpApp();
})();

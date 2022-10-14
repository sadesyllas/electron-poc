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
  const argv = await yargs(hideBin(process.argv))
    .option('in', {
      requiresArg: true,
      type: 'string',
      demandOption: true,
    })
    .option('out', {
      requiresArg: true,
      type: 'string',
      demandOption: true,
    })
    .help('h').argv;

  streamsCloser = setupStreams(argv.in, argv.out, {
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

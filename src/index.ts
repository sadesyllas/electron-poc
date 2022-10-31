import { app, BrowserWindow, globalShortcut, session } from 'electron';
import * as path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { getStreamsSetupFunction } from './io';
import { InitWindowProps } from './types';
import { processCommand } from './command/commandProcessor';

const setupStreams = getStreamsSetupFunction();
let streamsCloser: (() => void) | undefined;

let win: BrowserWindow;

const createWindow = (windowProps: InitWindowProps) => {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
    title: windowProps.title,
    titleBarStyle: windowProps.noTitle ? 'hidden' : 'default',
    frame: !windowProps.noFrame,
    maximizable: !windowProps.noMaximizable,
    minimizable: !windowProps.noMinimizable,
    movable: !windowProps.noMovable,
    alwaysOnTop: windowProps.alwaysOnTop,
    transparent: windowProps.transparent,
    opacity: windowProps.opacity,
    show: !windowProps.minimize && !windowProps.maximize,
  });

  win.setIgnoreMouseEvents(windowProps.clickThrough);

  // noinspection JSIgnoredPromiseFromCall
  win.loadFile('index.html');

  if (windowProps.minimize) {
    win.minimize();
    win.minimize(); // not sure why this is needed, at least in Linux
  }

  if (windowProps.maximize) {
    win.maximize();
  }

  if (windowProps.focusOnStart) {
    win.focus();
  }
};

const wireUpApp = (windowProps: InitWindowProps) => {
  app.whenReady().then(() => {
    globalShortcut.register('CommandOrControl+Alt+I', () => win.webContents.toggleDevTools());

    createWindow(windowProps);

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow(windowProps);
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
  let parser = yargs(hideBin(process.argv))
    .help('h')
    .option('title', {
      requiresArg: true,
      type: 'string',
      demandOption: true,
    })
    .option('no-frame', { requiresArg: false })
    .option('no-title', { requiresArg: false })
    .option('no-maximizable', { requiresArg: false })
    .option('no-minimizable', { requiresArg: false })
    .option('no-movable', { requiresArg: false, description: 'This does not work in Linux' })
    .option('maximize', { requiresArg: false })
    .option('minimize', { requiresArg: false })
    .option('transparent', { requiresArg: false })
    .option('always-on-top', { requiresArg: false })
    .option('click-through', { requiresArg: false })
    .option('focus', { requiresArg: false })
    .option('opacity', {
      requiresArg: true,
      type: 'number',
      coerce: (input) => Math.max(Math.min(input, 100.0), 0.0),
      description: 'This does not work in Linux',
    })
    .parserConfiguration({
      'boolean-negation': false,
    });

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

  wireUpApp({
    title: argv.title,
    noTitle: !!argv['no-title'],
    noFrame: !!argv['no-frame'],
    transparent: !!argv['transparent'],
    noMaximizable: !!argv['no-maximizable'],
    noMovable: !!argv['no-movable'],
    maximize: !!argv['maximize'],
    noMinimizable: !!argv['no-minimizable'],
    minimize: !!argv['minimize'],
    alwaysOnTop: !!argv['always-on-top'],
    clickThrough: !!argv['click-through'],
    opacity: argv['opacity'],
    focusOnStart: !!argv['focus'],
  });

  setupStreams(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    argv.in ?? argv.server,
    argv.out,
    {
      input: (input) => {
        const result = processCommand(input, { window: win });
        win?.webContents.send('input', result);
        return Promise.resolve(result);
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

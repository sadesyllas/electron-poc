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
    x: windowProps.y === undefined ? undefined : windowProps.x,
    y: windowProps.x === undefined ? undefined : windowProps.y,
    center: windowProps.center,
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
    .option('no-frame', { requiresArg: false, description: 'Do not create the window frame' })
    .option('no-title', { requiresArg: false, description: 'Do not display the window title' })
    .option('no-maximizable', { requiresArg: false, description: 'Do not allow the window to be maximized' })
    .option('no-minimizable', { requiresArg: false, description: 'Do not allow the window to be minimized' })
    .option('no-movable', {
      requiresArg: false,
      description: 'Do not allow the window to be moved (this does not work in Linux)',
    })
    .option('maximize', { requiresArg: false, description: 'Create the window in maximized form' })
    .option('minimize', { requiresArg: false, description: 'Create the window in minimized form' })
    .option('transparent', { requiresArg: false, description: 'Create a transparent window' })
    .option('always-on-top', { requiresArg: false, description: 'Set the window to be always on top' })
    .option('click-through', { requiresArg: false, description: 'Set the window to ignore mouse events' })
    .option('focus', { requiresArg: false, description: 'Focus the window on start' })
    .option('opacity', {
      requiresArg: true,
      type: 'number',
      coerce: (input) => Math.max(Math.min(input, 1.0), 0.0),
      description: 'Set the window opacity in the inclusive range of [0.0, 1.0] (this does not work in Linux)',
    })
    .option('center', { requiresArg: false, description: 'Create the window in the center of the screen' })
    .option('x', {
      requiresArg: true,
      type: 'number',
      description: 'Set the X screen coordinate for the window (both X and Y must be set to be used)',
    })
    .option('y', {
      requiresArg: true,
      type: 'number',
      description: 'Set the Y screen coordinate for the window (both X and Y must be set to be used)',
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
    x: argv['x'],
    y: argv['y'],
    center: !!argv['center'],
    focusOnStart: !!argv['focus'],
  });

  setupStreams(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    argv.in ?? argv.server,
    argv.out,
    {
      input: (input) => {
        const result = processCommand(input, { window: win, exit: () => app.exit() });
        try {
          win?.webContents.send('input', result);
        } catch {
          // ignore
        }
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

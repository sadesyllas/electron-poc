import { contextBridge, ipcRenderer } from 'electron';

ipcRenderer.on('input', (event, args) => {
  console.log(`received: ${args}`);
});

contextBridge.exposeInMainWorld('appInput', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onInput: (callback: any) => ipcRenderer.on('input', callback),
  onIOError: (callback: any) => {
    ipcRenderer.on('io.end', callback);
    ipcRenderer.on('io.close', callback);
    ipcRenderer.on('io.error', callback);
  },
});

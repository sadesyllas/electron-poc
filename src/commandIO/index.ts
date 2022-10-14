import { setupStreams as setupStreamsForLinux } from './linux';
import { setupStreams as setupStreamsForWin32 } from './win32';

export const getStreamsSetupFunction = () => {
  switch (process.platform) {
    case 'linux':
      return setupStreamsForLinux;
    case 'win32':
      return setupStreamsForWin32;
    default:
      throw new Error(`platform ${process.platform} is not supported`);
  }
};

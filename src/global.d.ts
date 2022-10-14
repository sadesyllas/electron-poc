type OnInputCallback = (event: any, args: any) => void;
type OnInputErrorCallback = (error?: Error) => void;

export interface IAppInput {
  onInput: (OnInputCallback) => Promise<void>;
  onIOError: (OnInputErrorCallback) => Promise<void>;
}

declare global {
  interface Window {
    appInput: IAppInput;
  }
}

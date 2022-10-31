import { BrowserWindow } from 'electron';

export interface InitWindowProps {
  noFrame: boolean;
  title: string;
  noTitle: boolean;
  noMaximizable: boolean;
  noMinimizable: boolean;
  noMovable: boolean;
  maximize: boolean;
  minimize: boolean;
  transparent: boolean;
  alwaysOnTop: boolean;
  clickThrough: boolean;
  opacity: number | undefined;
  x: number | undefined;
  y: number | undefined;
  center: boolean;
  focusOnStart: boolean;
}

export interface CommandWindowProps {
  title?: string;
  maximizable?: boolean;
  minimizable?: boolean;
  movable?: boolean;
  show?: boolean;
  maximize?: boolean;
  minimize?: boolean;
  alwaysOnTop?: boolean;
  clickThrough?: boolean;
  opacity?: number;
  focus?: boolean;
  x?: number;
  y?: number;
  animate?: boolean;
  center?: boolean;
}

export interface Command {
  name: CommandName;
  args?: CommandWindowProps;
}

export interface CommandContext {
  window: BrowserWindow;
  exit: () => void;
}

export interface Event {
  name: EventName;
  args?: unknown;
}

export type CommandName = 'getWindowProps' | 'setWindowProps' | 'exit';

export type EventName = 'ok' | 'info' | 'error' | 'error.command.invalid' | 'window.props' | 'exit';

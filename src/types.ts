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
}

export interface Command {
  type: CommandType;
  args?: CommandWindowProps;
}

export interface CommandContext {
  window: BrowserWindow;
}

export interface Event {
  type: EventType;
  args?: unknown;
}

export enum CommandType {
  GetWindowProps = 1,
  SetWindowProps = 2,
}

export enum EventType {
  Ok = 1,
  Info = 2,
  Error = 3,
  InvalidCommand = 4,
  WindowProps = 5,
}

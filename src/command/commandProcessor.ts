import { Command, CommandContext, CommandType, CommandWindowProps, Event, EventType } from '../types';
import { getWindowProps, setWindowProps } from './windowProps';

export const processCommand = (input: string, context: CommandContext): string => {
  let command: Command | undefined = undefined;
  let result: Event[] | undefined = undefined;

  try {
    command = JSON.parse(input);
  } catch (error) {
    result = [{ type: EventType.Error, args: error }];
  }

  if (command) {
    switch (command.type) {
      case CommandType.GetWindowProps:
        result = getWindowProps(context);
        break;
      case CommandType.SetWindowProps:
        result = setWindowProps(<CommandWindowProps>command.args, context);
        break;
      default:
        result = [{ type: EventType.InvalidCommand }];
        break;
    }
  }

  return JSON.stringify(result);
};

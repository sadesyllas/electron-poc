import { Command, CommandContext, CommandWindowProps, Event } from '../types';
import { getWindowProps, setWindowProps } from './windowProps';

export const processCommand = (input: string, context: CommandContext): string => {
  let command: Command | undefined = undefined;
  let result: Event[] | undefined = undefined;

  try {
    command = JSON.parse(input);
  } catch (error) {
    result = [{ name: 'error', args: error }];
  }

  if (command) {
    switch (command.name) {
      case 'getWindowProps':
        result = getWindowProps(context);
        break;
      case 'setWindowProps':
        result = setWindowProps(<CommandWindowProps>command.args, context);
        break;
      case 'exit':
        context.exit();
        result = [{ name: 'exit' }];
        break;
      default:
        result = [{ name: 'error.command.invalid' }];
        break;
    }
  }

  return JSON.stringify(result);
};

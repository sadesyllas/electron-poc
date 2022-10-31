import { CommandContext, CommandWindowProps, Event } from '../types';

export const getWindowProps = ({ window }: CommandContext): Event[] => {
  const props: unknown = {
    title: window.title,
    maximizable: window.maximizable,
    minimizable: window.minimizable,
    movable: window.movable,
    visible: window.isVisible(),
    maximized: window.isMaximized(),
    minimized: window.isMinimized(),
    alwaysOnTop: window.isAlwaysOnTop(),
    opacity: window.getOpacity(),
    focused: window.isFocused(),
  };

  return [{ name: 'window.props', args: props }];
};

export const setWindowProps = (props: CommandWindowProps, context: CommandContext): Event[] => {
  const {
    alwaysOnTop,
    clickThrough,
    focus,
    maximizable,
    maximize,
    minimizable,
    minimize,
    movable,
    opacity,
    show,
    title,
    x,
    y,
    center,
    animate,
  } = props;

  const { window } = context;

  if (title !== undefined) {
    window.setTitle(title);
  }

  if (maximizable !== undefined) {
    window.setMaximizable(maximizable);
  }

  if (maximize !== undefined) {
    if (maximize) {
      window.maximize();
    } else {
      window.unmaximize();
    }
  }

  if (minimizable !== undefined) {
    window.setMinimizable(minimizable);
  }

  if (minimize !== undefined) {
    if (minimize) {
      window.minimize();
    } else {
      window.show();
    }
  }

  if (movable !== undefined) {
    window.setMovable(movable);
  }

  if (show !== undefined) {
    if (show) {
      window.show();
    } else {
      window.hide();
    }
  }

  if (alwaysOnTop !== undefined) {
    window.setAlwaysOnTop(alwaysOnTop);
  }

  if (clickThrough !== undefined) {
    window.setIgnoreMouseEvents(clickThrough);
  }

  if (opacity !== undefined) {
    window.setOpacity(opacity);
  }

  if (x !== undefined && y !== undefined) {
    window.setPosition(x, y, animate);
  }

  if (center) {
    window.center();
  }

  if (focus) {
    window.focus();
  }

  return [{ name: 'ok' }];
};

import { LMSCommands } from './lms-commands.js';
import { LMSTag } from './lms-player-tags.js';

export interface LMSMessageOptions {
  command: LMSCommands;
  args?: (string | number)[];
  tags?: LMSTag[];
}

export class LMSMessage {
  private command: LMSCommands;
  private args: (string | number)[];
  private tags: LMSTag[];

  constructor({ command, args = [], tags = [] }: LMSMessageOptions) {
    this.command = command;
    this.args = args;
    this.tags = tags;
  }

  toJSON(): (string | number | Record<string, unknown>)[] {
    return [
      this.command,
      ...this.args,
      ...(this.tags.length ? [{ tags: this.tags.join('') }] : []),
    ];
  }
}

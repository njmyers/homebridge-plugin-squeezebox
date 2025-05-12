import type * as LMS from '../schemas/types/index.js';
import { Validators } from '../schemas/index.js';
import { LMSCommands } from './lms-commands.js';
import { LMSMessage } from './lms-message.js';
import { request } from './request.js';
import { Logger } from '../logger.js';

interface LMSServerOptions {
  host: string;
  port: number;
  log: Logger;
}

export class LMSServer {
  host: string;
  port: number;

  private log: Logger;

  constructor({ host, port, log }: LMSServerOptions) {
    this.host = host;
    this.port = port;
    this.log = log;
  }

  private async send(player: string, message: LMSMessage): Promise<unknown> {
    return request({
      host: this.host,
      port: this.port,
      player,
      message,
      logger: this.log,
    });
  }

  async getPlayers(): Promise<LMS.PlayersResponse> {
    const data = await this.send(
      'FF:FF:FF:FF',
      new LMSMessage({
        command: LMSCommands.Players,
        args: ['0'],
      }),
    );

    if (!Validators.PlayersResponse.validate(data)) {
      throw new Error('Invalid getPlayers response from server');
    }

    return data;
  }

  async getPlayerStatus(player: string): Promise<LMS.PlayerStatusResponse> {
    const data = await this.send(
      player,
      new LMSMessage({
        command: LMSCommands.Status,
        args: ['-'],
      }),
    );

    if (!Validators.PlayerStatusResponse.validate(data)) {
      throw new Error('Invalid getPlayerStatus response from server');
    }

    return data;
  }
}

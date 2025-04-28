import type * as LMS from '../schemas/types';
import { Validators } from '../schemas';
import { LMSCommands } from './lms-commands';
import { LMSMessage } from './lms-message';

interface LMSServerOptions {
  host: string;
  port: number;
}

export class LMSServer {
  private host: string;
  private port: number;

  constructor({ host, port }: LMSServerOptions) {
    this.host = host;
    this.port = port;
  }

  private async request(player: string, message: LMSMessage): Promise<unknown> {
    const response = await fetch(
      `http://${this.host}:${this.port}/jsonrpc.js`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method: 'slim.request',
          params: [player, message.toJSON()],
        }),
      },
    );

    return await response.json();
  }

  async getPlayers(): Promise<LMS.PlayersResponse> {
    const data = await this.request(
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
    const data = await this.request(
      player,
      new LMSMessage({
        command: LMSCommands.Status,
        args: ['-'],
      }),
    );

    if (!Validators.PlayerStatusResponse.validate(data)) {
      console.log(Validators.PlayerStatusResponse.validate.errors);
      console.log(JSON.stringify(data, null, 2));
      throw new Error('Invalid getPlayerStatus response from server');
    }

    return data;
  }
}

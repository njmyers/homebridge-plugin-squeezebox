import { Logger } from '../logger.js';
import { LMSMessage } from './lms-message.js';

export interface RequestOptions {
  host: string;
  port: number;
  player: string;
  message: LMSMessage;
  logger: Logger;
}

export async function request({
  player,
  message,
  host,
  port,
  logger,
}: RequestOptions): Promise<unknown> {
  if (logger) {
    logger.debug('Sending request to LMS server', {
      host,
      port,
      player,
      message: message.toJSON(),
    });
  }

  const response = await fetch(`http://${host}:${port}/jsonrpc.js`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      method: 'slim.request',
      params: [player, message.toJSON()],
    }),
  });

  return await response.json();
}

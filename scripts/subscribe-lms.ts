import { ConsoleLogger } from '../src/logger';
import {
  LMSServer,
  LMSPlayer,
  LMSMessage,
  LMSTag,
  LMSCommands,
} from '../src/lms';

const host = process.env.LMS_HOST;
const port = 9000;

(async () => {
  try {
    if (!host) {
      throw new Error('LMS_HOST environment variable is not set.');
    }

    const server = new LMSServer({ port, host });
    const response = await server.getPlayers();
    const player = new LMSPlayer({
      id: response.result.players_loop[0].playerid,
      name: response.result.players_loop[0].name,
      port,
      host,
      logger: new ConsoleLogger(),
    });

    player.subscribe(
      new LMSMessage({
        command: LMSCommands.Status,
        args: ['-', 1, 'subscribe:1'],
        tags: [LMSTag.Volume, LMSTag.PlayerState],
      }),
      m => console.log(m),
      s => console.log(s),
    );
  } catch (error) {
    console.error('Error:', error);
  }
})();

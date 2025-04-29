import {
  LMSServer,
  LMSPlayer,
  LMSMessage,
  LMSTag,
  LMSCommands,
} from '../src/lms';

const server = new LMSServer({
  port: 9000,
  host: '192.168.1.50',
});

(async () => {
  try {
    const response = await server.getPlayers();
    const player = new LMSPlayer({
      id: response.result.players_loop[0].playerid,
      name: response.result.players_loop[0].name,
      port: 9000,
      host: '192.168.1.50',
      logger: console,
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

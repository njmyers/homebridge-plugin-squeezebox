import net from 'net';
import { Logger } from '../logger.js';

export interface LMSTelenetNotifierOptions {
  host: string;
  port: number;
  logger: Logger;
}

export enum LMSTelenetTopic {
  FavoritesChanged = 'favorites changed',
  RescanDone = 'rescan done',
  LibraryChanged = 'library changed',
  UnknownIr = 'unknownir',
  PrefSet = 'prefset',
  Alarm = 'alarm',
  PlaylistNewSong = 'playlist newsong',
  PlaylistStop = 'playlist stop',
  PlaylistPause = 'playlist pause',
}

export interface LMSTelenetTopicHandler {
  (topic: LMSTelenetTopic): void;
}

export class LMSTelenetNotifier {
  private socket: net.Socket;
  private logger: Logger;

  host: string;

  constructor({ host, port, logger }: LMSTelenetNotifierOptions) {
    this.logger = logger;
    this.host = host;
    this.socket = new net.Socket();
    this.socket.connect(port, host, () => {
      logger.info('Telenet connections established with LMS', {
        host,
        port,
      });
      this.socket.write('listen 1\n');
    });
  }

  subscribe(subscriptions: LMSTelenetTopic[], handler: LMSTelenetTopicHandler) {
    this.socket.on('data', data => {
      const lines = data.toString().split('\n');
      for (const line of lines) {
        if (line.trim().length === 0) {
          continue;
        }

        const lines = data.toString().split('\n');
        for (const line of lines) {
          if (line.trim().length === 0) {
            continue;
          }

          subscriptions.forEach(topic => {
            if (line.includes(topic)) {
              this.logger.debug('Topic notification received from LMS', {
                topic,
                line,
              });

              handler(topic);
            }
          });
        }
      }
    });
  }

  disconnect() {
    this.socket.end(() => {
      this.logger.info('Telenet connection disconnected from LMS', {
        host: this.socket.remoteAddress,
        port: this.socket.remotePort,
      });
    });
  }
}

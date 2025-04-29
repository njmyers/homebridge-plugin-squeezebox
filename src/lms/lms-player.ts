import { Callback, CometD, SubscriptionHandle } from 'cometd';
import { adapt } from 'cometd-nodejs-client';
import { Logger } from '../logger';
import { LMSMessage } from './lms-message';
import { Validators } from '../schemas';

export interface SqueezePlayerOptions {
  id: string;
  name: string;
  host: string;
  port: number;
  logger: Logger;
}

export class LMSPlayer {
  private id: string;
  private name: string;
  private host: string;
  private port: number;
  private cometd: CometD;
  private subscription: SubscriptionHandle | null = null;
  private logger: Logger;

  constructor({ id, name, host, port, logger }: SqueezePlayerOptions) {
    adapt();
    this.id = id;
    this.name = name;
    this.host = host;
    this.port = port;
    this.logger = logger;

    this.cometd = new CometD();
    this.cometd.configure({
      url: `http://${this.host}:${this.port}/cometd`,
      appendMessageTypeToURL: false,
    });
  }

  subscribe(
    message: LMSMessage,
    onMessage: Callback,
    onSubscription: Callback,
  ) {
    this.cometd.handshake(handshake => {
      if (handshake.successful) {
        this.logger.debug('LMS Server handshake successful', {
          name: this.name,
          handshake,
        });

        const request = {
          response: `/slim/${handshake.clientId}/request`,
          request: [this.id, message.toJSON()],
        };

        this.subscription = this.cometd.subscribe(
          `/slim/${handshake.clientId}/request`,
          onMessage,
          onSubscription,
        );

        this.cometd.publish('/slim/request', request, response => {
          if (!Validators.ChannelEvent.validate(response)) {
            this.logger.error('Unknown message received from LMS server', {
              name: this.name,
              response,
            });
          } else {
            onMessage(response);
          }
        });
      }
    });
  }

  unsubscribe() {
    if (this.subscription) {
      this.cometd.unsubscribe(this.subscription);
      this.subscription = null;
    }
  }
}

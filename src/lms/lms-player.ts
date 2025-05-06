import { CometD, Message, SubscriptionHandle } from 'cometd';
import { adapt } from 'cometd-nodejs-client';
import { request } from './request.js';
import { Logger } from '../logger.js';
import { LMSMessage } from './lms-message.js';
import { Validators } from '../schemas/index.js';
import {
  ChannelEvent,
  SubscriptionStatusEvent,
} from '../schemas/types/index.js';

export interface SqueezePlayerOptions {
  id: string;
  name: string;
  host: string;
  port: number;
  logger: Logger;
}

export interface MessageHandler<T> {
  (message: T): void;
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

  get manufacturer() {
    return 'Logitech';
  }

  get model() {
    return 'Squeezebox';
  }

  get serialNumber() {
    return this.id;
  }

  get displayName() {
    return this.name;
  }

  subscribe(
    message: LMSMessage,
    handleChanelEvent: MessageHandler<ChannelEvent>,
    handleSubscriptionEvent: MessageHandler<SubscriptionStatusEvent>,
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
          response => {
            this.handleChannel(response, handleChanelEvent);
          },
          response => {
            this.handleSubscription(response, handleSubscriptionEvent);
          },
        );

        this.cometd.publish('/slim/request', request, response => {
          this.handleChannel(response, handleChanelEvent);
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

  async send(message: LMSMessage) {
    return await request({
      host: this.host,
      port: this.port,
      player: this.id,
      message,
      logger: this.logger,
    });
  }

  private handleChannel(
    message: Message,
    handler: MessageHandler<ChannelEvent>,
  ) {
    if (!Validators.ChannelEvent.validate(message)) {
      this.logger.error('Unknown message received from LMS server', {
        name: this.name,
        message,
        errors: Validators.ChannelEvent.validate.errors,
      });
    } else {
      handler(message);
    }
  }

  private handleSubscription(
    message: Message,
    handler: MessageHandler<SubscriptionStatusEvent>,
  ) {
    if (!Validators.SubscriptionStatusEvent.validate(message)) {
      this.logger.error(
        'Unknown subscription status received from LMS server',
        {
          name: this.name,
          message,
          errors: Validators.SubscriptionStatusEvent.validate.errors,
        },
      );
    } else {
      handler(message);
    }
  }
}

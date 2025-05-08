import { CometD, Message, SubscriptionHandle } from 'cometd';
import { adapt } from 'cometd-nodejs-client';
import { request } from './request.js';
import { Logger } from '../logger.js';
import { LMSMessage } from './lms-message.js';
import { Validators } from '../schemas/index.js';
import { ChannelEvent, SubscriptionEvent } from '../schemas/types/index.js';

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
    onChannel: MessageHandler<ChannelEvent>,
    onSubscription: MessageHandler<SubscriptionEvent>,
  ) {
    this.cometd.handshake(handshake => {
      if (handshake.successful) {
        this.logger.debug('LMS Server handshake successful', {
          name: this.name,
          handshake,
        });

        this.subscription = this.cometd.subscribe(
          `/slim/${handshake.clientId}/request`,
          response => this.onChannel(response, onChannel),
          response => this.onSubscription(response, onSubscription),
        );
      }
    });
  }

  publish(
    clientId: string,
    command: LMSMessage,
    handler: MessageHandler<ChannelEvent>,
  ) {
    try {
      const request = {
        response: `/slim/${clientId}/request`,
        request: [this.id, command.toJSON()],
      };

      this.cometd.publish('/slim/request', request, response => {
        this.onChannel(response, handler);
      });
    } catch (error) {
      this.logger.error('Error publishing message to LMS server', {
        name: this.name,
        error,
      });
    }
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

  private onChannel(message: Message, handler: MessageHandler<ChannelEvent>) {
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

  private onSubscription(
    message: Message,
    handler: MessageHandler<SubscriptionEvent>,
  ) {
    if (!Validators.SubscriptionEvent.validate(message)) {
      this.logger.error(
        'Unknown subscription status received from LMS server',
        {
          name: this.name,
          message,
          errors: Validators.SubscriptionEvent.validate.errors,
        },
      );
    } else {
      handler(message);
    }
  }
}

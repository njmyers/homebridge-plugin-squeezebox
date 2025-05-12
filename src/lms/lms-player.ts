import { CometD, Message, SubscriptionHandle } from 'cometd';
import { adapt } from 'cometd-nodejs-client';
import { request } from './request.js';
import { Logger } from '../logger.js';
import { LMSMessage } from './lms-message.js';
import { Validators } from '../schemas/index.js';
import {
  ChannelEvent,
  SubscriptionSuccessEvent,
} from '../schemas/types/index.js';
import { LMSTelenetNotifier, LMSTelenetTopic } from './lms-telenet-notifier.js';

export interface SqueezePlayerOptions {
  id: string;
  name: string;
  host: string;
  port: number;
  version: string;
  model: string;
  manufacturer: string;
  logger: Logger;
  notifier: LMSTelenetNotifier;
}

export interface LMSTelenetSubscription {
  topic: LMSTelenetTopic;
  message: LMSMessage;
}

export interface LMSCometDSubscription {
  message: LMSMessage;
}

export type LMSSubscription = LMSTelenetSubscription | LMSCometDSubscription;

export interface LMSSubscriptionHandler<T> {
  (message: T): void;
}

export class LMSPlayer {
  private id: string;
  private name: string;
  private host: string;
  private port: number;
  private version: string;
  private model: string;
  private manufacturer: string;
  private cometd: CometD;
  private subscription: SubscriptionHandle | null = null;
  private notifier: LMSTelenetNotifier;
  private logger: Logger;

  constructor({
    id,
    name,
    host,
    port,
    version,
    model,
    manufacturer,
    logger,
    notifier,
  }: SqueezePlayerOptions) {
    adapt();
    this.id = id;
    this.name = name;
    this.host = host;
    this.port = port;
    this.version = version;
    this.model = model;
    this.manufacturer = manufacturer;
    this.logger = logger;
    this.notifier = notifier;

    this.cometd = new CometD();
    this.cometd.configure({
      url: `http://${this.host}:${this.port}/cometd`,
      appendMessageTypeToURL: false,
    });
  }

  get SerialNumber() {
    return this.id;
  }

  get DisplayName() {
    return this.name;
  }

  get Version() {
    return this.version;
  }

  get Manufacturer() {
    return this.manufacturer;
  }

  get Model() {
    return this.model;
  }

  connect(
    onChannel: LMSSubscriptionHandler<ChannelEvent>,
    onSubscription: LMSSubscriptionHandler<SubscriptionSuccessEvent>,
  ) {
    this.cometd.handshake(handshake => {
      if (handshake.successful) {
        this.logger.debug('LMS Server handshake successful', {
          name: this.name,
          handshake,
        });

        this.subscription = this.cometd.subscribe(
          `/slim/${handshake.clientId}/request`,
          response => {
            this.handler(response, Validators.ChannelEvent, onChannel);
          },
          response => {
            this.handler(
              response,
              Validators.SubscriptionEvent,
              onSubscription,
            );
          },
        );
      }
    });
  }

  subscribe(
    clientId: string,
    subscriptions: LMSSubscription[],
    handler: LMSSubscriptionHandler<ChannelEvent>,
  ) {
    const telenet = subscriptions.filter(subscription => {
      return LMSPlayer.isTelenetSubscription(subscription);
    });

    const cometd = subscriptions.filter(subscription => {
      return !LMSPlayer.isTelenetSubscription(subscription);
    });

    this.notifier.subscribe(
      telenet.map(s => s.topic),
      topic => {
        const subscription = telenet.find(s => s.topic === topic)!;
        this.publish(String(clientId), subscription.message, handler);
      },
    );

    cometd.forEach(subscription => {
      this.publish(String(clientId), subscription.message, handler);
    });

    telenet.forEach(subscription => {
      this.publish(String(clientId), subscription.message, handler);
    });
  }

  unsubscribe() {
    if (this.subscription) {
      this.cometd.unsubscribe(this.subscription);
      this.subscription = null;
    }

    this.notifier.disconnect();
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

  private publish(
    clientId: string,
    command: LMSMessage,
    handler: LMSSubscriptionHandler<ChannelEvent>,
  ) {
    const request = {
      response: `/slim/${clientId}/request`,
      request: [this.id, command.toJSON()],
    };

    this.cometd.publish('/slim/request', request, response => {
      this.handler(response, Validators.ChannelEvent, handler);
    });
  }

  private handler<V extends (typeof Validators)[keyof typeof Validators], T>(
    message: Message,
    validator: V,
    handler: LMSSubscriptionHandler<T>,
  ) {
    if (!validator.validate(message)) {
      this.logger.error('Unknown message received from LMS server', {
        name: this.name,
        message,
        errors: validator.validate.errors,
      });
    } else {
      handler(message as T);
    }
  }

  private static isTelenetSubscription(
    subscription: LMSSubscription,
  ): subscription is LMSTelenetSubscription {
    return 'topic' in subscription && subscription.topic !== undefined;
  }
}

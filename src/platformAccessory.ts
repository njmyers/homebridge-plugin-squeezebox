import type { PlatformAccessory } from 'homebridge';

import {
  SqueezeBoxInformationService,
  SqueezeBoxSpeakerService,
  SqueezeBoxSwitchService,
  SqueezeBoxTelevisionService,
} from './services/index.js';
import {
  LMSPlayer,
  LMSMessage,
  LMSCommands,
  LMSTag,
  LMSPlayerStatus,
  LMSTelenetTopic,
} from './lms/index.js';

import { EventName, Subscriber } from './services/types.js';
import { ServiceLogger } from './logger.js';
import { ChannelEvent } from './schemas/types';
import { Validators } from './schemas/index.js';

import type { SqueezeboxHomebridgePlatform } from './platform.js';

export interface SqueezeboxAccessoryContext {
  player: string;
}

const ENABLE_SWITCH = false;
const ENABLE_SPEAKER = true;

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class SqueezeboxPlatformPlayerAccessory {
  private television: SqueezeBoxTelevisionService;
  private switch: SqueezeBoxSwitchService | null = null;
  private speaker: SqueezeBoxSpeakerService | null = null;
  private information: SqueezeBoxInformationService;

  private subscribers: Subscriber[] = [];
  private log: ServiceLogger;

  constructor(
    private readonly platform: SqueezeboxHomebridgePlatform,
    private readonly accessory: PlatformAccessory<SqueezeboxAccessoryContext>,
    private readonly player: LMSPlayer,
  ) {
    this.log = new ServiceLogger(platform, this.constructor.name, this.Name);
    this.information = new SqueezeBoxInformationService(
      this.platform,
      this.accessory,
      this.player,
    );

    this.television = new SqueezeBoxTelevisionService(
      this.platform,
      this.accessory,
      this.player,
    );

    this.subscribers.push(this.television);

    if (ENABLE_SWITCH) {
      this.switch = new SqueezeBoxSwitchService(
        this.platform,
        this.accessory,
        this.player,
      );

      this.subscribers.push(this.switch);
    }

    if (ENABLE_SPEAKER) {
      this.speaker = new SqueezeBoxSpeakerService(
        this.platform,
        this.accessory,
        this.player,
      );

      this.subscribers.push(this.speaker);
    }

    this.player.connect(
      message => this.handler(message),
      subscription => {
        this.log.info('Subscription enabled', subscription);

        const subscriptions = [
          {
            message: new LMSMessage({
              command: LMSCommands.Status,
              args: ['-', 1, 'subscribe:30'],
              tags: [LMSTag.Volume, LMSTag.PlayerState],
            }),
          },
          {
            topic: LMSTelenetTopic.FavoritesChanged,
            message: new LMSMessage({
              command: LMSCommands.Favorites,
              args: ['items', 0, 10],
            }),
          },
        ];

        this.player.subscribe(subscription.clientId, subscriptions, message => {
          this.handler(message);
        });
      },
    );
  }

  get Name(): string {
    return this.player.DisplayName;
  }

  private handler(event: ChannelEvent) {
    if (Validators.PlayerStatusEvent.validate(event)) {
      const message = new LMSPlayerStatus(event.data);
      return this.subscribers.forEach(subscriber => {
        subscriber.on({ name: EventName.Status, message });
      });
    }

    if (Validators.FavoritesEvent.validate(event)) {
      return this.subscribers.forEach(subscriber => {
        subscriber.on({ name: EventName.Favorites, message: event });
      });
    }

    if (Validators.SubscriptionEvent.validate(event)) {
      return this.subscribers.forEach(subscriber => {
        subscriber.on({ name: EventName.Subscription, message: event });
      });
    }

    return this.log.error('Received unknown message from LMS server', {
      event,
    });
  }
}

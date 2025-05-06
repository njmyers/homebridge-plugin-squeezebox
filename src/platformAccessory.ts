import type { Logging, PlatformAccessory } from 'homebridge';

import type { SqueezeboxHomebridgePlatform } from './platform.js';
import { LMSPlayer } from './lms/lms-player.js';
import { LMSMessage } from './lms/lms-message.js';
import { LMSCommands } from './lms/lms-commands.js';
import { LMSTag } from './lms/lms-player-tags.js';

import { ChannelEvent } from './schemas/types';
import { Validators } from './schemas/index.js';

import {
  SqueezeBoxInformationService,
  SqueezeBoxSpeakerService,
  SqueezeBoxSwitchService,
  SqueezeBoxTelevisionService,
} from './services/index.js';
import { LMSPlayerStatus } from './lms/lms-player-status.js';
import { StatusSubscriber } from './services/types.js';

export interface SqueezeboxAccessoryContext {
  player: LMSPlayer;
}

const ENABLE_SWITCH = true;
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
  private subscribers: StatusSubscriber[] = [];

  constructor(
    private readonly platform: SqueezeboxHomebridgePlatform,
    private readonly accessory: PlatformAccessory<SqueezeboxAccessoryContext>,
  ) {
    this.information = new SqueezeBoxInformationService(
      this.platform,
      this.accessory,
    );

    this.television = new SqueezeBoxTelevisionService(
      this.platform,
      this.accessory,
      this.accessory.context.player,
    );

    this.subscribers.push(this.television);

    if (ENABLE_SWITCH) {
      this.switch = new SqueezeBoxSwitchService(
        this.platform,
        this.accessory,
        this.accessory.context.player,
      );

      this.subscribers.push(this.switch);
    }

    if (ENABLE_SPEAKER) {
      this.speaker = new SqueezeBoxSpeakerService(
        this.platform,
        this.accessory,
        this.accessory.context.player,
      );

      this.subscribers.push(this.speaker);
    }

    this.accessory.context.player.subscribe(
      new LMSMessage({
        command: LMSCommands.Status,
        args: ['-', 1, 'subscribe:30'],
        tags: [LMSTag.Volume, LMSTag.PlayerState],
      }),
      message => this.handler(message),
      subscription => this.log.info('Subscription enabled', subscription),
    );
  }

  get log(): Logging {
    return this.platform.log;
  }

  private handler(event: ChannelEvent) {
    if (!Validators.PlayerStatusEvent.validate(event)) {
      this.log.error('Received non player status message from LMS server', {
        player: this.accessory.context.player.displayName,
        event,
      });
      return;
    }

    const message = new LMSPlayerStatus(event.data);
    this.subscribers.forEach(subscriber => {
      subscriber.update(message);
    });
  }
}

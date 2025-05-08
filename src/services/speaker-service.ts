import type {
  Characteristic,
  CharacteristicValue,
  PlatformAccessory,
  Service,
  WithUUID,
} from 'homebridge';
import type { SqueezeboxHomebridgePlatform } from '../platform.js';
import type { SqueezeboxAccessoryContext } from '../platformAccessory.js';
import { LMSPlayer } from '../lms/lms-player.js';
import { StatusSubscriber } from './types.js';
import { LMSMessage } from '../lms/lms-message.js';
import { LMSCommands } from '../lms/lms-commands.js';
import { ServiceLogger } from '../logger.js';
import { LMSPlayerStatus } from '../lms/index.js';

type Characteristics = WithUUID<new () => Characteristic>;

export class SqueezeBoxSpeakerService implements StatusSubscriber {
  private speaker: Service;
  private state: Map<Characteristics, CharacteristicValue>;
  private log: ServiceLogger;

  constructor(
    readonly platform: SqueezeboxHomebridgePlatform,
    private readonly accessory: PlatformAccessory<SqueezeboxAccessoryContext>,
    private readonly player: LMSPlayer,
  ) {
    this.log = new ServiceLogger(platform, this.constructor.name, this.Name);
    this.state = new Map<Characteristics, CharacteristicValue>([
      [this.platform.Characteristic.Mute, false],
      [this.platform.Characteristic.Volume, 0],
      [
        this.platform.Characteristic.Active,
        this.platform.Characteristic.Active.INACTIVE,
      ],
    ]);

    this.speaker =
      this.accessory.getService(this.platform.Service.TelevisionSpeaker) ||
      this.accessory.addService(this.platform.Service.TelevisionSpeaker);

    this.speaker.setCharacteristic(
      this.platform.Characteristic.Name,
      this.Name,
    );

    this.speaker.setCharacteristic(
      this.platform.Characteristic.VolumeControlType,
      this.platform.Characteristic.VolumeControlType.ABSOLUTE,
    );

    this.speaker
      .getCharacteristic(this.platform.Characteristic.Mute)
      .onGet(() => this.Mute)
      .onSet(this.setMute.bind(this));

    this.speaker
      .getCharacteristic(this.platform.Characteristic.Volume)
      .onGet(() => this.Volume);

    this.speaker
      .getCharacteristic(this.platform.Characteristic.VolumeSelector)
      .onSet(this.setVolumeSelector.bind(this));

    this.speaker
      .getCharacteristic(this.platform.Characteristic.Active)
      .onGet(() => this.Active)
      .onSet(this.setActive.bind(this));
  }

  private get Name(): CharacteristicValue {
    return `${this.accessory.context.player.displayName} Volume`;
  }

  private get Mute(): CharacteristicValue {
    return this.state.get(this.platform.Characteristic.Mute)!;
  }

  private get Volume(): CharacteristicValue {
    return this.state.get(this.platform.Characteristic.Volume)!;
  }

  private get Active(): CharacteristicValue {
    return this.state.get(this.platform.Characteristic.Active)!;
  }

  private async setMute(value: CharacteristicValue) {
    this.log.debug('Setting mute state', {
      value,
    });

    const current = this.Mute;

    if (typeof current !== 'number') {
      throw new Error('Invalid value for setting mute state');
    }

    if (current === value) {
      this.log.debug('Mute state is already set to the same value');
      return;
    }

    await this.player.send(
      new LMSMessage({
        command: LMSCommands.Mixer,
        args: ['muting', value ? '1' : '0'],
      }),
    );
  }

  private async setActive(value: CharacteristicValue) {
    this.log.debug('Setting active state', {
      value,
    });

    const current = this.Active;

    if (typeof current !== 'number') {
      throw new Error('Invalid value for setting active state');
    }

    if (current === value) {
      this.log.debug('Active state is already set to the same value');
      return;
    }

    await this.player.send(
      new LMSMessage({
        command: LMSCommands.Power,
        args: [value ? '1' : '0'],
      }),
    );
  }

  private async setVolumeSelector(value: CharacteristicValue) {
    this.log.debug('Setting Volume Selector State', {
      value,
    });

    const current = this.Volume;

    if (typeof current !== 'number') {
      throw new Error('Invalid value for setting volume selector');
    }

    if (current >= 100 && value === 0) {
      this.log.debug('Volume is already at maximum');
      return;
    }

    if (current === 0 && value === 1) {
      this.log.debug('Volume is already at minimum');
      return;
    }

    const change = value === 0 ? 5 : -5;

    await this.player.send(
      new LMSMessage({
        command: LMSCommands.Mixer,
        args: ['volume', change > 0 ? `+${change}` : `${change}`],
      }),
    );
  }

  private set(
    characteristic: Characteristics,
    value: CharacteristicValue,
  ): void {
    const current = this.state.get(characteristic);

    if (current !== value) {
      this.log.debug('Setting speaker state', {
        characteristic,
        value,
        current,
      });

      this.state.set(characteristic, value);
      this.speaker.getCharacteristic(characteristic).updateValue(value);
    }
  }

  status(message: LMSPlayerStatus): void {
    this.set(this.platform.Characteristic.Mute, message.mute);
    this.set(this.platform.Characteristic.Volume, message.volume);
    this.set(this.platform.Characteristic.Active, message.active);
  }
}

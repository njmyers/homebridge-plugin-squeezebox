import {
  Characteristic,
  CharacteristicValue,
  Logging,
  PlatformAccessory,
  Service,
  WithUUID,
} from 'homebridge';

import {
  LMSCommands,
  LMSMessage,
  LMSPlayer,
  LMSPlayerStatus,
} from '../lms/index.js';
import { SqueezeboxHomebridgePlatform } from '../platform.js';
import { SqueezeboxAccessoryContext } from '../platformAccessory.js';
import { StatusSubscriber } from './types.js';

type Characteristics = WithUUID<new () => Characteristic>;

export class SqueezeBoxTelevisionService implements StatusSubscriber {
  private television: Service;
  private state: Map<Characteristics, CharacteristicValue>;

  constructor(
    private readonly platform: SqueezeboxHomebridgePlatform,
    private readonly accessory: PlatformAccessory<SqueezeboxAccessoryContext>,
    private readonly player: LMSPlayer,
  ) {
    this.state = new Map([
      [this.platform.Characteristic.Active, 0],
      [this.platform.Characteristic.Volume, 0],
      [this.platform.Characteristic.Mute, 0],
      [
        this.platform.Characteristic.CurrentMediaState,
        this.platform.Characteristic.CurrentMediaState.PAUSE,
      ],
      [
        this.platform.Characteristic.TargetMediaState,
        this.platform.Characteristic.TargetMediaState.PAUSE,
      ],
    ]);

    this.television =
      this.accessory.getService(this.platform.Service.Television) ||
      this.accessory.addService(this.platform.Service.Television);

    this.television.setCharacteristic(
      this.platform.Characteristic.Name,
      this.Name,
    );

    this.television.setCharacteristic(
      this.platform.Characteristic.ConfiguredName,
      this.ConfiguredName,
    );

    this.television
      .getCharacteristic(this.platform.Characteristic.Active)
      .onGet(() => this.Active)
      .onSet(this.setActive.bind(this));

    this.television
      .getCharacteristic(this.platform.Characteristic.Mute)
      .onGet(() => this.Mute)
      .onSet(this.setMute.bind(this));

    this.television
      .getCharacteristic(this.platform.Characteristic.Volume)
      .onGet(() => this.Volume)
      .onSet(this.setVolume.bind(this));

    this.television
      .getCharacteristic(this.platform.Characteristic.RemoteKey)
      .onSet(this.setRemoteKey.bind(this));

    this.television
      .getCharacteristic(this.platform.Characteristic.SleepDiscoveryMode)
      .onGet(() => this.SleepDiscoveryMode);

    this.television
      .getCharacteristic(this.platform.Characteristic.ActiveIdentifier)
      .onGet(() => this.ActiveIdentifier)
      .onSet(this.setActiveIdentifier.bind(this));
  }

  private get log(): Logging {
    return this.platform.log;
  }

  private get Name(): CharacteristicValue {
    return this.accessory.context.player.displayName;
  }

  private get ConfiguredName(): CharacteristicValue {
    return this.Name;
  }

  private get Active(): CharacteristicValue {
    return this.state.get(this.platform.Characteristic.Active)!;
  }

  private get ActiveIdentifier(): CharacteristicValue {
    return 1;
  }

  private get SleepDiscoveryMode(): CharacteristicValue {
    return this.platform.Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE;
  }

  private get Volume(): CharacteristicValue {
    return this.state.get(this.platform.Characteristic.Volume)!;
  }

  private get Mute(): CharacteristicValue {
    return this.state.get(this.platform.Characteristic.Mute)!;
  }

  private setActive(value: CharacteristicValue): void {
    this.log.info('Setting Active State', {
      service: 'SqueezeBoxSpeakerService',
      player: this.accessory.context.player.displayName,
      value,
    });

    const current = this.Active;

    if (typeof current !== 'number') {
      throw new Error('Invalid value for setting active state');
    }

    if (current === value) {
      this.log.info('Active state is already set to the same value');
      return;
    }

    this.player.send(
      new LMSMessage({
        command: LMSCommands.Power,
        args: [value ? '1' : '0'],
      }),
    );

    this.state.set(this.platform.Characteristic.Active, value);
  }

  private setActiveIdentifier(value: CharacteristicValue): void {
    this.log.info('Setting Active Identifier', {
      player: this.accessory.context.player.displayName,
      value,
    });
  }

  private setMute(value: CharacteristicValue): void {
    this.log.info('Setting Mute', {
      player: this.accessory.context.player.displayName,
      value,
    });
  }

  private setVolume(value: CharacteristicValue): void {
    this.log.info('Setting Volume', {
      player: this.accessory.context.player.displayName,
      value,
    });
  }

  private setRemoteKey(value: CharacteristicValue): void {
    this.log.info('Setting Remote Key', {
      player: this.accessory.context.player.displayName,
      value,
    });
  }

  private set(
    characteristic: Characteristics,
    value: CharacteristicValue,
  ): void {
    const current = this.state.get(characteristic);

    if (current !== value) {
      this.state.set(characteristic, value);
      this.television.getCharacteristic(characteristic).updateValue(value);
    }
  }

  update(message: LMSPlayerStatus): void {
    this.set(this.platform.Characteristic.Volume, message.volume);
    this.set(this.platform.Characteristic.Active, message.active);
  }
}

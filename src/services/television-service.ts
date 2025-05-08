import {
  Characteristic,
  CharacteristicValue,
  PlatformAccessory,
  Service,
  WithUUID,
} from 'homebridge';

import {
  LMSCommands,
  LMSMessage,
  LMSPlayer,
  LMSPlayerStatus,
  PlayerMode,
} from '../lms/index.js';
import { SqueezeboxHomebridgePlatform } from '../platform.js';
import { SqueezeboxAccessoryContext } from '../platformAccessory.js';
import { StatusSubscriber } from './types.js';
import { ServiceLogger } from '../logger.js';
import { SqueezeBoxInputService } from './input-service.js';

type Characteristics = WithUUID<new () => Characteristic>;

export class SqueezeBoxTelevisionService implements StatusSubscriber {
  private television: Service;
  private state: Map<Characteristics, CharacteristicValue>;
  private log: ServiceLogger;

  constructor(
    private readonly platform: SqueezeboxHomebridgePlatform,
    private readonly accessory: PlatformAccessory<SqueezeboxAccessoryContext>,
    private readonly player: LMSPlayer,
    private readonly inputs: SqueezeBoxInputService[],
  ) {
    this.log = new ServiceLogger(platform, this.Name);
    this.state = new Map<Characteristics, CharacteristicValue>([
      [this.platform.Characteristic.Active, 0],
      [this.platform.Characteristic.ActiveIdentifier, inputs[0].Identifier],
      [this.platform.Characteristic.ConfiguredName, this.Name],
      [
        this.platform.Characteristic.CurrentMediaState,
        this.platform.Characteristic.CurrentMediaState.PAUSE,
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
      this.platform.Characteristic.SleepDiscoveryMode,
      this.SleepDiscoveryMode,
    );

    this.television.setCharacteristic(
      this.platform.Characteristic.DisplayOrder,
      this.platform.api.hap
        .encode(
          1,
          this.inputs.map(i => i.Identifier),
        )
        .toString('base64'),
    );

    this.television
      .getCharacteristic(this.platform.Characteristic.ConfiguredName)
      .onGet(() => this.ConfiguredName)
      .onSet(this.setConfiguredName.bind(this));

    this.television
      .getCharacteristic(this.platform.Characteristic.ActiveIdentifier)
      .onGet(() => this.ActiveIdentifier)
      .onSet(this.setActiveIdentifier.bind(this));

    this.television
      .getCharacteristic(this.platform.Characteristic.Active)
      .onGet(() => this.Active)
      .onSet(this.setActive.bind(this));

    this.television
      .getCharacteristic(this.platform.Characteristic.CurrentMediaState)
      .onGet(() => this.CurrentMediaState);

    this.television
      .getCharacteristic(this.platform.Characteristic.RemoteKey)
      .onSet(this.setRemoteKey.bind(this));

    this.inputs.forEach(input => {
      this.television.addLinkedService(input.Service);
    });
  }

  private get Name(): CharacteristicValue {
    return this.accessory.context.player.displayName;
  }

  private get ConfiguredName(): CharacteristicValue {
    return this.state.get(this.platform.Characteristic.ConfiguredName)!;
  }

  private get Active(): CharacteristicValue {
    return this.state.get(this.platform.Characteristic.Active)!;
  }

  private get CurrentMediaState(): CharacteristicValue {
    return this.state.get(this.platform.Characteristic.CurrentMediaState)!;
  }

  private get ActiveIdentifier(): CharacteristicValue {
    return this.state.get(this.platform.Characteristic.ActiveIdentifier)!;
  }

  private get SleepDiscoveryMode(): CharacteristicValue {
    return this.platform.Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE;
  }

  private setConfiguredName(value: CharacteristicValue): void {
    this.set(this.platform.Characteristic.ConfiguredName, value);
  }

  private setActive(value: CharacteristicValue): void {
    this.log.info('Setting active state', {
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
  }

  private setActiveIdentifier(value: CharacteristicValue): void {
    this.log.info('Setting Active Identifier', {
      player: this.accessory.context.player.displayName,
      value,
    });

    this.set(this.platform.Characteristic.ActiveIdentifier, value);
  }

  private async setRemoteKey(value: CharacteristicValue) {
    this.log.info('Setting remote key', {
      value,
    });

    const message = (() => {
      switch (value) {
      case this.platform.Characteristic.RemoteKey.PLAY_PAUSE: {
        return new LMSMessage({
          command:
              this.CurrentMediaState ===
              this.platform.Characteristic.CurrentMediaState.PLAY
                ? LMSCommands.Pause
                : LMSCommands.Play,
        });
      }
      case this.platform.Characteristic.RemoteKey.ARROW_RIGHT:
      case this.platform.Characteristic.RemoteKey.NEXT_TRACK: {
        return new LMSMessage({
          command: LMSCommands.Playlist,
          args: ['index', '+1'],
        });
      }
      case this.platform.Characteristic.RemoteKey.ARROW_LEFT:
      case this.platform.Characteristic.RemoteKey.PREVIOUS_TRACK: {
        return new LMSMessage({
          command: LMSCommands.Playlist,
          args: ['index', '-1'],
        });
      }
      case this.platform.Characteristic.RemoteKey.REWIND: {
        return new LMSMessage({
          command: LMSCommands.Time,
          args: ['-10'],
        });
      }
      case this.platform.Characteristic.RemoteKey.FAST_FORWARD: {
        return new LMSMessage({
          command: LMSCommands.Time,
          args: ['+10'],
        });
      }
      case this.platform.Characteristic.RemoteKey.BACK: {
        return new LMSMessage({
          command: LMSCommands.Time,
          args: ['0'],
        });
      }
      default: {
        return undefined;
      }
      }
    })();

    if (message) {
      await this.player.send(message);
    }
  }

  private set(
    characteristic: Characteristics,
    value: CharacteristicValue,
  ): void {
    const current = this.state.get(characteristic);

    if (current !== value) {
      this.log.debug('Updating television state', {
        characteristic,
        value,
        current,
      });

      this.state.set(characteristic, value);
      this.television.getCharacteristic(characteristic).updateValue(value);
    }
  }

  update(message: LMSPlayerStatus): void {
    this.set(this.platform.Characteristic.Active, message.active);
    this.set(
      this.platform.Characteristic.CurrentMediaState,
      message.mode === PlayerMode.Play
        ? this.platform.Characteristic.CurrentMediaState.PLAY
        : this.platform.Characteristic.CurrentMediaState.PAUSE,
    );
  }
}

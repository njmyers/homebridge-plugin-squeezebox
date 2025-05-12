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
  PlayerMode,
} from '../lms/index.js';
import { SqueezeboxHomebridgePlatform } from '../platform.js';
import { SqueezeboxAccessoryContext } from '../platformAccessory.js';
import { Subscriber, EventName, Events } from './types.js';
import { ServiceLogger } from '../logger.js';
import { SqueezeBoxInputService } from './input-service.js';

type Characteristics = WithUUID<new () => Characteristic>;

export class SqueezeBoxTelevisionService implements Subscriber {
  private television: Service;
  private state: Map<Characteristics, CharacteristicValue>;
  private log: ServiceLogger;
  private inputs: SqueezeBoxInputService[] = [];

  constructor(
    private readonly platform: SqueezeboxHomebridgePlatform,
    private readonly accessory: PlatformAccessory<SqueezeboxAccessoryContext>,
    private readonly player: LMSPlayer,
  ) {
    const input = new SqueezeBoxInputService(
      platform,
      accessory,
      SqueezeBoxInputService.DEFAULT_NAME,
      SqueezeBoxInputService.DEFAULT_ID,
    );

    this.log = new ServiceLogger(platform, this.constructor.name, this.Name);
    this.state = new Map<Characteristics, CharacteristicValue>([
      [this.platform.Characteristic.Active, 0],
      [this.platform.Characteristic.ConfiguredName, this.Name],
      [this.platform.Characteristic.ActiveIdentifier, input.Identifier],
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

    this.television
      .getCharacteristic(this.platform.Characteristic.DisplayOrder)
      .onGet(() => this.DisplayOrder);

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

    this.addInput(input);
  }

  private get Name(): CharacteristicValue {
    return this.player.DisplayName;
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

  private get DisplayOrder(): CharacteristicValue {
    return this.platform.api.hap
      .encode(
        1,
        this.inputs.map(i => i.Identifier),
      )
      .toString('base64');
  }

  private setConfiguredName(value: CharacteristicValue): void {
    this.set(this.platform.Characteristic.ConfiguredName, value);
  }

  private async setActive(value: CharacteristicValue): Promise<void> {
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

  private async setActiveIdentifier(value: CharacteristicValue): Promise<void> {
    this.log.debug('Setting Active Identifier', {
      player: this.player.DisplayName,
      value,
    });

    this.set(this.platform.Characteristic.ActiveIdentifier, value);

    const input = this.inputs.find(i => i.Identifier === value);
    if (input && !input.match(SqueezeBoxInputService.DEFAULT_ID)) {
      await this.player.send(
        new LMSMessage({
          command: LMSCommands.Favorites,
          args: [
            LMSCommands.Playlist,
            LMSCommands.Play,
            `item_id:${input.squeezeId}`,
          ],
        }),
      );
    }
  }

  private async setRemoteKey(value: CharacteristicValue) {
    this.log.debug('Setting remote key', {
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

  private addInput(input: SqueezeBoxInputService): void {
    this.television.addLinkedService(input.Service);
    this.inputs.push(input);
  }

  private removeInput(input: SqueezeBoxInputService): void {
    this.television.removeLinkedService(input.Service);
    this.inputs = this.inputs.filter(i => i !== input);
  }

  on(e: Events): void {
    switch (e.name) {
    case EventName.Status: {
      this.set(this.platform.Characteristic.Active, e.message.active);
      this.set(
        this.platform.Characteristic.CurrentMediaState,
        e.message.mode === PlayerMode.Play
          ? this.platform.Characteristic.CurrentMediaState.PLAY
          : this.platform.Characteristic.CurrentMediaState.PAUSE,
      );
      return;
    }

    case EventName.Favorites: {
      this.log.debug('Favorites e', {
        message: e.message,
        favorites: e.message.data.loop_loop[0],
      });

      const favorites = e.message.data.loop_loop;

      favorites
        .filter(
          favorite => !this.inputs.find(input => input.match(favorite.id)),
        )
        .forEach(favorite => {
          this.addInput(
            new SqueezeBoxInputService(
              this.platform,
              this.accessory,
              favorite.name,
              favorite.id,
            ),
          );
        });

      this.inputs
        .filter(
          input =>
            !favorites.find(
              favorite =>
                input.match(favorite.id) ||
                  input.match(SqueezeBoxInputService.DEFAULT_ID),
            ),
        )
        .forEach(input => this.removeInput(input));

      return;
    }
    }
  }
}

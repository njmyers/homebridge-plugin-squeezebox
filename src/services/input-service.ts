import {
  Characteristic,
  CharacteristicValue,
  PlatformAccessory,
  Service,
  WithUUID,
} from 'homebridge';

import { LMSPlayer } from '../lms/index.js';
import { SqueezeboxHomebridgePlatform } from '../platform.js';
import { SqueezeboxAccessoryContext } from '../platformAccessory.js';
import { ServiceLogger } from '../logger.js';

type Characteristics = WithUUID<new () => Characteristic>;

export class SqueezeBoxInputService {
  private input: Service;
  private state: Map<Characteristics, CharacteristicValue>;
  private log: ServiceLogger;

  constructor(
    private readonly platform: SqueezeboxHomebridgePlatform,
    private readonly accessory: PlatformAccessory<SqueezeboxAccessoryContext>,
    private readonly player: LMSPlayer,
    private readonly id: number,
  ) {
    this.log = new ServiceLogger(platform, this.Name);
    this.state = new Map<Characteristics, CharacteristicValue>([
      [this.platform.Characteristic.ConfiguredName, this.Name],
    ]);

    this.input =
      this.accessory.getService(this.Name) ||
      this.accessory.addService(
        this.platform.Service.InputSource,
        this.Name,
        this.Subtype,
      );

    this.input.setCharacteristic(this.platform.Characteristic.Name, this.Name);

    this.input.setCharacteristic(
      this.platform.Characteristic.IsConfigured,
      this.platform.Characteristic.IsConfigured.CONFIGURED,
    );

    this.input.setCharacteristic(
      this.platform.Characteristic.InputSourceType,
      this.platform.Characteristic.InputSourceType.APPLICATION,
    );

    this.input.setCharacteristic(
      this.platform.Characteristic.CurrentVisibilityState,
      this.platform.Characteristic.CurrentVisibilityState.SHOWN,
    );

    this.input.setCharacteristic(
      this.platform.Characteristic.TargetVisibilityState,
      this.platform.Characteristic.TargetVisibilityState.SHOWN,
    );

    this.input.setCharacteristic(
      this.platform.Characteristic.Identifier,
      this.Identifier,
    );

    this.input
      .getCharacteristic(this.platform.Characteristic.ConfiguredName)
      .onGet(() => this.ConfiguredName)
      .onSet(this.setConfiguredName.bind(this));
  }

  get Identifier(): number {
    return this.id;
  }

  get Subtype(): string {
    return `Input-${this.Identifier}`;
  }

  get Service(): Service {
    return this.input;
  }

  private get Name(): string {
    return `${this.accessory.context.player.displayName} Input ${this.Identifier}`;
  }

  private get ConfiguredName(): CharacteristicValue {
    return this.state.get(this.platform.Characteristic.ConfiguredName)!;
  }

  private setConfiguredName(value: CharacteristicValue): void {
    this.set(this.platform.Characteristic.ConfiguredName, value);
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
      this.input.getCharacteristic(characteristic).updateValue(value);
    }
  }
}

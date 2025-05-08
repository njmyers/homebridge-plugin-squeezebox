import {
  CharacteristicValue,
  Logging,
  PlatformAccessory,
  Service,
} from 'homebridge';
import {
  LMSCommands,
  LMSMessage,
  LMSPlayer,
  PlayerMode,
  LMSPlayerStatus,
} from '../lms/index.js';
import { SqueezeboxHomebridgePlatform } from '../platform.js';
import { SqueezeboxAccessoryContext } from '../platformAccessory.js';
import { StatusSubscriber } from './types.js';

export class SqueezeBoxSwitchService implements StatusSubscriber {
  private switch: Service;
  private state: boolean;

  constructor(
    private readonly platform: SqueezeboxHomebridgePlatform,
    private readonly accessory: PlatformAccessory<SqueezeboxAccessoryContext>,
    private readonly player: LMSPlayer,
  ) {
    this.state = false;
    this.switch =
      this.accessory.getService(this.platform.Service.Switch) ||
      this.accessory.addService(this.platform.Service.Switch);

    this.switch.setCharacteristic(this.platform.Characteristic.Name, this.Name);

    this.switch
      .getCharacteristic(this.platform.Characteristic.On)
      .onGet(() => this.state)
      .onSet(this.handler.bind(this));
  }

  get log(): Logging {
    return this.platform.log;
  }

  get Name(): string {
    return `${this.accessory.context.player.displayName} Switch`;
  }

  handler(value: CharacteristicValue): void {
    if (typeof value !== 'boolean') {
      this.log.error('Invalid value for switch', { value });
      return;
    }

    this.log.debug('Setting switch state', {
      value,
    });

    this.state = value;
    this.player.send(
      new LMSMessage({
        command: value ? LMSCommands.Play : LMSCommands.Pause,
      }),
    );
  }

  status(message: LMSPlayerStatus): void {
    const state = PlayerMode.Play === message.mode;

    if (this.state !== state) {
      this.log.debug('Updating switch state', {
        mode: message.mode,
        name: this.player.displayName,
      });

      this.state = state;
      this.switch.updateCharacteristic(
        this.platform.Characteristic.On,
        this.state,
      );
    }
  }
}

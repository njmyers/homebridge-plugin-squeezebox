import type { PlatformAccessory, Service } from 'homebridge';
import type { SqueezeboxHomebridgePlatform } from '../platform.js';
import type { SqueezeboxAccessoryContext } from '../platformAccessory.js';
import { LMSPlayer } from '../lms/lms-player.js';

export class SqueezeBoxInformationService {
  private information: Service;

  constructor(
    private readonly platform: SqueezeboxHomebridgePlatform,
    private readonly accessory: PlatformAccessory<SqueezeboxAccessoryContext>,
    private readonly player: LMSPlayer,
  ) {
    this.information =
      this.accessory.getService(this.platform.Service.AccessoryInformation) ||
      this.accessory.addService(this.platform.Service.AccessoryInformation);

    this.information
      .setCharacteristic(this.platform.Characteristic.Model, this.player.Model)
      .setCharacteristic(
        this.platform.Characteristic.Manufacturer,
        this.player.Manufacturer,
      )
      .setCharacteristic(
        this.platform.Characteristic.FirmwareRevision,
        this.player.Version,
      )
      .setCharacteristic(
        this.platform.Characteristic.SerialNumber,
        this.player.SerialNumber,
      );
  }
}

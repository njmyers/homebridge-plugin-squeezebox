import type { PlatformAccessory, Service } from 'homebridge';
import type { SqueezeboxHomebridgePlatform } from '../platform.js';
import type { SqueezeboxAccessoryContext } from '../platformAccessory.js';

export class SqueezeBoxInformationService {
  private information: Service;

  constructor(
    private readonly platform: SqueezeboxHomebridgePlatform,
    private readonly accessory: PlatformAccessory<SqueezeboxAccessoryContext>,
  ) {
    this.information =
      this.accessory.getService(this.platform.Service.AccessoryInformation) ||
      this.accessory.addService(this.platform.Service.AccessoryInformation);

    this.information
      .setCharacteristic(
        this.platform.Characteristic.Manufacturer,
        this.accessory.context.player.manufacturer,
      )
      .setCharacteristic(
        this.platform.Characteristic.Model,
        this.accessory.context.player.model,
      )
      .setCharacteristic(
        this.platform.Characteristic.SerialNumber,
        this.accessory.context.player.serialNumber,
      );
  }
}

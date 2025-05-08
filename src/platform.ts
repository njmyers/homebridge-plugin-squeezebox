import _ from 'lodash';
import {
  Categories,
  type API,
  type Characteristic,
  type DynamicPlatformPlugin,
  type Logging,
  type PlatformAccessory,
  type PlatformConfig,
  type Service,
} from 'homebridge';

import {
  SqueezeboxAccessoryContext,
  SqueezeboxPlatformPlayerAccessory,
} from './platformAccessory.js';
import { PLATFORM_NAME, PLUGIN_NAME } from './settings.js';
import { LMSServer } from './lms/lms-server.js';
import { LMSPlayer } from './lms/lms-player.js';
import { LMSMessage } from './lms/lms-message.js';
import { LMSCommands } from './lms/lms-commands.js';

export interface SqueezeboxPlatformServerConfig {
  host: string;
  port: number;
}

export interface SqueezeboxPlatformConfig {
  accessories: SqueezeboxPlatformServerConfig[];
}

type SqueezeboxAccessory = PlatformAccessory<SqueezeboxAccessoryContext>;

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class SqueezeboxHomebridgePlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service;
  public readonly Characteristic: typeof Characteristic;

  // this is used to track restored cached accessories
  public readonly accessories: Map<string, SqueezeboxAccessory> = new Map();
  public readonly discoveredCacheUUIDs: string[] = [];
  private readonly server: LMSServer;

  constructor(
    public readonly log: Logging,
    public readonly config: PlatformConfig & SqueezeboxPlatformConfig,
    public readonly api: API,
  ) {
    this.Service = api.hap.Service;
    this.Characteristic = api.hap.Characteristic;
    this.server = new LMSServer({
      port: config.accessories[0].port,
      host: config.accessories[0].host,
      log: this.log,
    });

    this.log.debug('Finished initializing platform:', this.config.name);

    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on('didFinishLaunching', () => {
      log.debug('Executed didFinishLaunching callback');
      // run the method to discover / register your devices as accessories
      this.discoverDevices();
    });
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to set up event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);

    // add the restored accessory to the accessories cache, so we can track if it has already been registered
    this.accessories.set(
      accessory.UUID,
      accessory as PlatformAccessory<SqueezeboxAccessoryContext>,
    );
  }

  /**
   * This is an example method showing how to register discovered accessories.
   * Accessories must only be registered once, previously created accessories
   * must not be registered again to prevent "duplicate UUID" errors.
   */
  async discoverDevices() {
    const data = await this.server.getPlayers();

    // loop over the discovered devices and register each one if it has not already been registered
    for (const player of data.result.players_loop) {
      const name = _.startCase(_.camelCase(player.name));
      const uuid = this.api.hap.uuid.generate(`${player.playerid}-v2`);
      const existingAccessory = this.accessories.get(uuid);

      if (existingAccessory) {
        // the accessory already exists
        this.log.info(
          'Restoring existing accessory from cache:',
          existingAccessory.displayName,
        );

        // Adding a category is some special sauce that gets this to work properly.
        // @see https://github.com/homebridge/homebridge/issues/2553#issuecomment-623675893
        existingAccessory.category = Categories.SPEAKER;
        // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. e.g.:
        existingAccessory.context.player = new LMSPlayer({
          id: player.playerid,
          name,
          port: this.config.accessories[0].port,
          host: this.config.accessories[0].host,
          logger: this.log,
        });

        // const favorites = await existingAccessory.context.player.send(
        //   new LMSMessage({
        //     command: LMSCommands.Favorites,
        //     args: ['items', 0, 10],
        //   }),
        // );

        // this.log.debug('favorites', JSON.stringify(favorites, null, 2));
        this.api.publishExternalAccessories(PLUGIN_NAME, [existingAccessory]);

        // create the accessory handler for the restored accessory
        // this is imported from `platformAccessory.ts`
        new SqueezeboxPlatformPlayerAccessory(this, existingAccessory);
      } else {
        this.log.info('Adding new accessory:', name);
        const accessory =
          new this.api.platformAccessory<SqueezeboxAccessoryContext>(
            name,
            uuid,
          );

        // Adding a category is some special sauce that gets this to work properly.
        // @see https://github.com/homebridge/homebridge/issues/2553#issuecomment-623675893
        accessory.category = Categories.SPEAKER;
        accessory.context.player = new LMSPlayer({
          id: player.playerid,
          name,
          port: this.config.accessories[0].port,
          host: this.config.accessories[0].host,
          logger: this.log,
        });

        // const favorites = await accessory.context.player.send(
        //   new LMSMessage({
        //     command: LMSCommands.Favorites,
        //     args: ['items', 0, 10],
        //   }),
        // );

        // this.log.debug('favorites', JSON.stringify(favorites, null, 2));
        new SqueezeboxPlatformPlayerAccessory(this, accessory);
        this.api.publishExternalAccessories(PLUGIN_NAME, [accessory]);
      }

      // push into discoveredCacheUUIDs
      this.discoveredCacheUUIDs.push(uuid);
    }

    // you can also deal with accessories from the cache which are no longer present by removing them from Homebridge
    // for example, if your plugin logs into a cloud account to retrieve a device list, and a user has previously removed a device
    // from this cloud account, then this device will no longer be present in the device list but will still be in the Homebridge cache
    for (const [uuid, accessory] of this.accessories) {
      if (!this.discoveredCacheUUIDs.includes(uuid)) {
        this.log.info(
          'Removing existing accessory from cache:',
          accessory.displayName,
        );
        this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
          accessory,
        ]);
      }
    }
  }
}

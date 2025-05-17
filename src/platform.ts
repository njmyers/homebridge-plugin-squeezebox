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
import { LMSTelenetNotifier } from './lms/lms-telenet-notifier.js';
import { SqueezeBoxPlatformConfig } from './config.js';

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
  private readonly servers: LMSServer[] = [];
  private readonly notifiers: LMSTelenetNotifier[] = [];

  constructor(
    public readonly log: Logging,
    public readonly config: PlatformConfig & SqueezeBoxPlatformConfig,
    public readonly api: API,
  ) {
    this.Service = api.hap.Service;
    this.Characteristic = api.hap.Characteristic;
    this.config.accessories.forEach(accessory => {
      this.notifiers.push(
        new LMSTelenetNotifier({
          host: accessory.host,
          port: accessory.ports.cli,
          logger: this.log,
        }),
      );

      this.servers.push(
        new LMSServer({
          port: accessory.ports.http,
          host: accessory.host,
          log: this.log,
        }),
      );
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
   * This function is invoked when homebridge restores cached accessories
   * from disk at startup. It should be used to set up event handlers for
   * characteristics and update respective values.
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
    for (const server of this.servers) {
      const data = await server.getPlayers();

      // loop over the discovered devices and register each one if it has not already been registered
      for (const player of data.result.players_loop) {
        const name = _.startCase(_.camelCase(player.name));
        const uuid = this.api.hap.uuid.generate(player.playerid);

        if (this.accessories.has(uuid)) {
          const accessory = this.accessories.get(uuid)!;
          // the accessory already exists
          this.log.info(
            'Restoring existing accessory from cache:',
            accessory.displayName,
          );

          accessory.category = Categories.SPEAKER;
          accessory.context.player = player.playerid;
          this.api.publishExternalAccessories(PLUGIN_NAME, [accessory]);

          // create the accessory handler for the restored accessory
          // this is imported from `platformAccessory.ts`
          new SqueezeboxPlatformPlayerAccessory(
            this,
            accessory,
            new LMSPlayer({
              id: player.playerid,
              name,
              port: server.port,
              host: server.host,
              model: player.model,
              manufacturer: player.modelname,
              version: String(player.firmware),
              logger: this.log,
              notifier: this.notifiers.find(n => n.host === server.host)!,
            }),
          );
        } else {
          this.log.info('Adding new accessory:', name);
          const accessory =
            new this.api.platformAccessory<SqueezeboxAccessoryContext>(
              name,
              uuid,
            );

          accessory.category = Categories.SPEAKER;
          accessory.context.player = player.playerid;

          new SqueezeboxPlatformPlayerAccessory(
            this,
            accessory,
            new LMSPlayer({
              id: player.playerid,
              name,
              port: server.port,
              host: server.host,
              model: player.model,
              manufacturer: player.modelname,
              version: String(player.firmware),
              logger: this.log,
              notifier: this.notifiers.find(n => n.host === server.host)!,
            }),
          );
          this.api.publishExternalAccessories(PLUGIN_NAME, [accessory]);
        }

        // push into discoveredCacheUUIDs
        this.discoveredCacheUUIDs.push(uuid);
      }

      /**
       * You can also deal with accessories from the cache which are no longer
       * present by removing them from Homebridge for example, if your plugin logs
       * into a cloud account to retrieve a device list, and a user has previously
       * removed a device from this cloud account, then this device will no longer
       * be present in the device list but will still be in the Homebridge cache
       */
      for (const [uuid, accessory] of this.accessories) {
        if (!this.discoveredCacheUUIDs.includes(uuid)) {
          this.log.info(
            'Removing existing accessory from cache',
            accessory.displayName,
          );
          this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
            accessory,
          ]);
        }
      }
    }
  }
}

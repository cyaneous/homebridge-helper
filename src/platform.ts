// https://github.com/monarco/monarco-hat-driver-nodejs/blob/master/examples/complex-demo.js
// https://www.lunos.de/files/Downloads/Einbauanleitungen/Einbauanleitung_5UNI-FT_E206_ab-SN-200.000.pdf

import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { TimerAccessory } from './timer';

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class HelperPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  // this is used to track restored cached accessories
  public readonly accessories: PlatformAccessory[] = [];

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.log.debug('Finished initializing platform:', this.config.name);

    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on('didFinishLaunching', () => {
      this.log.debug('Initializing Helper...');
      this.configureDevices(config);
    });
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);

    // add the restored accessory to the accessories cache so we can track if it has already been registered
    this.accessories.push(accessory);
  }

  private configureDevices(config) {
    for (const device of config.timers) {
      this.configureDevice(device);
    }

    // remove any stale accessories
    for (const accessory of this.accessories) {
      if (!config.timers.some(device => this.api.hap.uuid.generate(device.id) === accessory.UUID)) {
        this.log.info('Removing existing accessory from cache:', accessory.displayName);
        this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      }
    }
  }

  private configureDevice(device) {
    // generate a unique id for the accessory this should be generated from
    // something globally unique, but constant, for example, the device serial
    // number or MAC address
    const uuid = this.api.hap.uuid.generate(device.id);

    // see if an accessory with the same uuid has already been registered and restored from
    // the cached devices we stored in the `configureAccessory` method above
    const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

    if (existingAccessory) {
      // the accessory already exists
      this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);

      // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
      existingAccessory.context.config = device;
      this.api.updatePlatformAccessories([existingAccessory]);

      // create the accessory handler for the restored accessory
      // this is imported from `platformAccessory.ts`
      this.instantiateAccessory(device, existingAccessory);
    } else {
      // the accessory does not yet exist, so we need to create it
      this.log.info('Adding new accessory:', device.name);

      // create a new accessory
      const accessory = new this.api.platformAccessory(device.name, uuid);

      // store a copy of the device object in the `accessory.context`
      // the `context` property can be used to store any data about the accessory you may need
      accessory.context.config = device;

      // create the accessory handler for the newly create accessory
      // this is imported from `platformAccessory.ts`
      this.instantiateAccessory(device, accessory);

      // link the accessory to your platform
      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    }
  }

  instantiateAccessory(device, accessory) {
    switch (device.kind) {
      case 'timer': return new TimerAccessory(this, accessory);
      default: this.log.error('Invalid accessory kind:' + device.kind);
    }
  }

}

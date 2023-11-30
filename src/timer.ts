import { Service, PlatformAccessory, CharacteristicValue, APIEvent } from 'homebridge';

import { HelperPlatform } from './platform';

export class TimerAccessory {
  private service: Service;
  private interval: number;
  private timer: ReturnType<typeof setInterval>;

  constructor(
    private readonly platform: HelperPlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    this.interval = accessory.context.device.interval;

    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Cyaneous, Inc.')
      .setCharacteristic(this.platform.Characteristic.Model, 'Timer')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, 'Not Available');

    // get the ContactSensor service if it exists, otherwise create a new ContactSensor service
    // you can create multiple services for each accessory
    this.service = this.accessory.getService(this.platform.Service.StatelessProgrammableSwitch) ||
      this.accessory.addService(this.platform.Service.StatelessProgrammableSwitch);

    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.name);

    // register handlers for the Active Characteristic
    this.service.getCharacteristic(this.platform.Characteristic.ProgrammableSwitchEvent)
      .setProps({ minStep: 1, minValue: 0, maxValue: 0 })
      .onGet(this.getProgrammableSwitchEvent.bind(this));

    this.platform.api.on(APIEvent.SHUTDOWN, () => {
      clearInterval(this.timer);
    });

    this.timer = setInterval(() => {
      this.service.updateCharacteristic(this.platform.Characteristic.ProgrammableSwitchEvent, 
        this.platform.Characteristic.ProgrammableSwitchEvent.SINGLE_PRESS);
    }, this.interval * 1000);
  }

  async getProgrammableSwitchEvent(): Promise<CharacteristicValue> {
    return 0;
  }

}

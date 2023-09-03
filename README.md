# node-hue-ble
## Installation
```sh
npm i node-hue-ble
```

This library uses [`@abandonware/noble`](https://www.npmjs.com/package/@abandonware/noble), please see the [prerequisites](https://www.npmjs.com/package/@abandonware/noble#Prerequisites) for your operating system before using this library

## Example
This example uses Bluetooth to find nearby lamps, connects to the first one found, turn it on, set the color to white and the brightness to 100% and disconnect
```js
import { Client } from "node-hue-ble";

const scanner = await Client.scanForLamps()
scanner.on("discover", async peripheral => {
    console.log("Discovered peripheral", peripheral.advertisement.localName, peripheral.uuid)
    scanner.stopScanning()

    const lamp = new Client(peripheral)
    await lamp.connect()
    console.log("Connected to", await lamp.getLampName())

    await lamp.on()
    await lamp.setBrightness(100)
    // if your lamp does not support colors, you can use
    // .setTemperature(100) instead
    await lamp.setRGBColor("#ffffff")

    await lamp.disconnect()
    console.log("Disconnected")
    process.exit(0)
})
```

```sh
Discovered peripheral Bedroom xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Connected to Bedroom
Disconnected
```
# API
## Client
The Client class provides methods to interact with a smart lamp device over Bluetooth Low Energy (BLE). It is designed to manage connections, discover services and characteristics, and perform various operations such as turning the lamp on or off, setting brightness, temperature, and color, as well as managing the lamp name.

### Importing
```js
import { Client } from 'node-hue-ble';
```
### Static Methods
#### `static async scanForLamps(): Promise<Scanner>`
Scans for nearby lamps and returns a Scanner instance.

### Instance Methods
#### `constructor(peripheral: noble.Peripheral)`
Creates a new Client instance with the specified noble.Peripheral.

#### `async connect()`
Connects to the peripheral and discovers the services and characteristics.

#### `async disconnect()`
Disconnects from the peripheral.

#### `async off()`
Turns off the lamp.

#### `async on()`
Turns on the lamp.

#### `async toggle()`
Toggles the lamp's state.

#### `async isOn(): Promise<boolean>`
Returns whether the lamp is on or not.

#### `async setBrightness(brightness: number)`
Sets the brightness of the lamp (0-100).

#### `async getBrightness(): Promise<number>`
Returns the current brightness of the lamp.

#### `async setTemperature(temperature: number)`
Sets the color temperature of the lamp (0-100).

#### `async getTemperature(): Promise<number>`
Returns the current color temperature of the lamp.

#### `async setRGBColor(rgb: number[]|string|number|Buffer)`
Sets the color of the lamp using an RGB value, which can be provided in various formats (array, string, number, or Buffer).

#### `async setColor(color: number[])`
Sets the color of the lamp using a 4-element array.

#### `async getColor(): Promise<number[]>`
Returns the current color of the lamp as a 4-element array.

#### `async getLampName(): Promise<string|null>`
Returns the name of the lamp.

#### `async setLampName(name: string)`
Sets the name of the lamp.

### Properties
 - `peripheral: noble.Peripheral`
 - `services: noble.Service[]`
 - `characteristics: noble.Characteristic[]`
 - `lightService: noble.Service`
 - `lightCharacteristic: noble.Characteristic`
 - `brightnessCharacteristic: noble.Characteristic`
 - `temperatureCharacteristic: noble.Characteristic`
 - `colorCharacteristic: noble.Characteristic`
 - `settingsService: noble.Service`
 - `lampNameCharacteristic: noble.Characteristic`

Note: These properties are mostly used internally and should not be accessed directly. Use the provided instance methods to interact with the lamp.

## Scanner
The Scanner class is responsible for scanning and discovering BLE peripherals with the specified services. It extends the EEventEmitter class and emits a "discover" event when a matching peripheral is found.

### Importing
```js
import Scanner from 'node-hue-ble';
```
### Instance Methods
#### `constructor(services: string[])`
Creates a new Scanner instance with the specified array of services UUIDs.

#### `async startScanning()`
Starts scanning for peripherals with the specified services. Emits a "discover" event when a matching peripheral is found.

#### `async stopScanning()`
Stops scanning for peripherals and removes the "discover" event listener.

### Events
#### `discover`
Emitted when a matching peripheral is discovered. The event payload contains the discovered noble.Peripheral object.

### Usage Example
```js
import Scanner from './path/to/Scanner.js';
import { LIGHT_SERVICE, SETTINGS_SERVICE } from './constants.js';

const scanner = new Scanner([LIGHT_SERVICE, SETTINGS_SERVICE]);

scanner.on('discover', (peripheral) => {
    console.log('Discovered peripheral:', peripheral);
});

await scanner.startScanning();
setTimeout(async () => {
    await scanner.stopScanning();
}, 5000);
```
In this example, the scanner starts scanning for peripherals with the specified services for 5 seconds. When a matching peripheral is found, it logs the discovered peripheral to the console.
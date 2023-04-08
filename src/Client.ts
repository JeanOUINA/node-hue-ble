import Scanner from "./Scanner.js";
import noble from "@abandonware/noble"
import { BRIGHTNESS_CHARACTERISTIC, COLOR_CHARACTERISTIC, LAMP_NAME_CHARACTERISTIC, LIGHT_CHARACTERISTIC, LIGHT_SERVICE, SETTINGS_SERVICE, TEMPERATURE_CHARACTERISTIC } from "./constants.js";
import { convertRGB } from "./utils.js";

export class Client {
    static async scanForLamps():Promise<Scanner>{
        const scanner = new Scanner([
            LIGHT_SERVICE,
            SETTINGS_SERVICE
        ])
        await scanner.startScanning()
        return scanner
    }

    peripheral:noble.Peripheral
    services:noble.Service[] = []
    characteristics:noble.Characteristic[] = []
    constructor(peripheral:noble.Peripheral){
        this.peripheral = peripheral
    }

    async connect(){
        await this.peripheral.connectAsync()
        const resp = await this.peripheral.discoverSomeServicesAndCharacteristicsAsync([
            LIGHT_SERVICE,
            SETTINGS_SERVICE
        ], []);
        this.services = resp.services
        this.characteristics = resp.characteristics
    }
    async disconnect(){
        await this.peripheral.disconnectAsync()
    }

    get lightService(){
        return this.services.find(s => s.uuid === LIGHT_SERVICE)
    }
    get lightCharacteristic(){
        return this.characteristics.find(c => c.uuid === LIGHT_CHARACTERISTIC)
    }
    get brightnessCharacteristic(){
        return this.characteristics.find(c => c.uuid === BRIGHTNESS_CHARACTERISTIC)
    }
    get temperatureCharacteristic(){
        return this.characteristics.find(c => c.uuid === TEMPERATURE_CHARACTERISTIC)
    }
    get colorCharacteristic(){
        return this.characteristics.find(c => c.uuid === COLOR_CHARACTERISTIC)
    }

    get settingsService(){
        return this.services.find(s => s.uuid === SETTINGS_SERVICE)
    }
    get lampNameCharacteristic(){
        return this.characteristics.find(c => c.uuid === LAMP_NAME_CHARACTERISTIC)
    }

    async off(){
        await this.lightCharacteristic?.writeAsync(Buffer.from([0x00]), false)
    }
    async on(){
        await this.lightCharacteristic?.writeAsync(Buffer.from([0x01]), false)
    }
    async toggle(){
        const value = await this.lightCharacteristic?.readAsync()
        if(value?.readUInt8(0) === 0x00){
            await this.on()
        }else{
            await this.off()
        }
    }
    async isOn(){
        const value = await this.lightCharacteristic?.readAsync()
        if(!value)return false
        return value.readUInt8(0) === 0x01
    }

    async setBrightness(brightness:number){
        if(brightness < 0 || brightness > 100)throw new Error("Brightness must be between 0 and 100")

        await this.brightnessCharacteristic?.writeAsync(Buffer.from([
            Math.round(brightness * 0xfd / 100 + 1)
        ]), false)
    }
    async getBrightness(){
        const value = await this.brightnessCharacteristic?.readAsync()
        if(!value)return 0
        return (value[0] - 1) / 0xfd * 100
    }
    
    async setTemperature(temperature: number){
        const value = Math.floor(temperature / 100 * 347 + 153)
        await this.temperatureCharacteristic?.writeAsync(Buffer.from([
            value & 0xff,
            value >> 8
        ]), false)
    }
    async getTemperature(){
        const value = await this.temperatureCharacteristic?.readAsync()
        return (value.readUint16LE(0) - 153) / 347 * 100
    }

    async setRGBColor(rgb:number[]|string|number|Buffer){
        if(Buffer.isBuffer(rgb)){
            if(rgb.length !== 3)throw new Error("Invalid RGB buffer")
            rgb = [...rgb]
        }else if(typeof rgb === "string"){
            if(rgb[0] === "#"){
                rgb = rgb.slice(1)
            }
            if(rgb.length === 3){
                rgb = rgb.split("").map(c => parseInt(c + c, 16))
            }else if(rgb.length === 6){
                rgb = rgb.match(/.{2}/g)!.map(c => parseInt(c, 16))
            }else{
                throw new Error("Invalid RGB string")
            }
        }else if(typeof rgb === "number"){
            rgb = [
                (rgb >> 16) & 0xff,
                (rgb >> 8) & 0xff,
                rgb & 0xff
            ]
        }else if(Array.isArray(rgb)){
            if(rgb.length !== 3)throw new Error("Invalid RGB array")
            rgb = rgb.map(c => {
                if(typeof c !== "number")throw new Error("Invalid RGB array")
                return c
            })
        }else{
            throw new Error("Invalid RGB value")
        }

        await this.setColor(convertRGB(rgb))
    }
    async setColor(color: number[]){
        if(color.length !== 4)throw new Error("Invalid color array")
        if(!this.colorCharacteristic)throw new Error("Your lamp does not support color")
        await this.colorCharacteristic?.writeAsync(Buffer.from(color), false)
    }
    async getColor(){
        if(!this.colorCharacteristic)throw new Error("Your lamp does not support color")
        const value = await this.colorCharacteristic?.readAsync()
        if(!value)return [0, 0, 0, 0]
        return [...value]
    }

    async getLampName(){
        const value = await this.lampNameCharacteristic?.readAsync()
        if(!value)return null
        return value.toString("utf8")
    }
    async setLampName(name:string){
        await this.lampNameCharacteristic?.writeAsync(Buffer.from(name, "utf8"), false)
    }
}
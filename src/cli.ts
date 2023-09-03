#!/usr/bin/env node
import inquirer from "inquirer"
import { Client } from "./Client.js"
import { Peripheral } from "@abandonware/noble"
import { convertRGB, makePromise } from "./utils.js"

const { scanForLamps } = await inquirer.prompt({
    type: "confirm",
    name: "scanForLamps",
    message: "Start scanning for lamps ?",
})
if(!scanForLamps){
    process.exit(0)
}

const [
    promise,
    resolve
] = makePromise<void>()
const lamps:Peripheral[] = []
const ui = new inquirer.ui.BottomBar()
let timer = 15
const updateBottomBar = () => {
    ui.updateBottomBar(`Scanning for lamps... ${timer} seconds left${lamps.length > 0 ? ` (press enter to stop scanning)` : ""}`)
}
updateBottomBar()
const interval = setInterval(() => {
    timer--
    if(timer === 0){
        resolve()
    }else{   
        updateBottomBar()
    }
}, 1000)
const scanner = await Client.scanForLamps()
scanner.on("discover", peripheral => {
    ui.log.write(`Found lamp: \x1b[35m${peripheral.advertisement.localName}\x1b[0m (${peripheral.id})`)
    lamps.push(peripheral)
})
const listener = (data:Buffer) => {
    if(lamps.length == 0)return
    if(data[0] === 0x0d){
        resolve()
    }
}
process.stdin.on("data", listener)

await promise
process.stdin.removeListener("data", listener)
clearInterval(interval)
scanner.stopScanning()
ui.log.write(`Found \x1b[32m${lamps.length}\x1b[0m lamps`)
ui.updateBottomBar("")
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
ui.clean()

if(lamps.length == 0){
    ui.log.write("\x1b[31mNo lamps found\x1b[0m")
    process.exit(0)
}

let peripheral = lamps[0]
if(lamps.length > 1){
    const { lamp } = await inquirer.prompt({
        type: "list",
        name: "lamp",
        message: "Select a lamp",
        choices: lamps.map(peripheral => ({
            name: peripheral.advertisement.localName,
            value: peripheral
        }))
    })
    peripheral = lamp
}
const { confirm } = await inquirer.prompt({
    type: "confirm",
    name: "confirm",
    message: `Connect to \x1b[35m${peripheral.advertisement.localName}\x1b[0m (${peripheral.id}) ?`
})
if(!confirm){
    process.exit(0)
}

ui.updateBottomBar("Status: Connecting to lamp...")
const client = new Client(peripheral)
await client.connect();
ui.updateBottomBar("")
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
ui.clean()

const name = await client.getLampName()
if(name === ""){
    ui.log.write("\x1b[31mThere seems to be a connection issue with your lamp\x1b[0m")
    ui.log.write("\x1b[31mTry resetting your lamp, and connect your computer BEFORE your phone\x1b[0m")
}
ui.log.write(`Lamp name: \x1b[35m${name}\x1b[0m`)
ui.log.write(`Lamp Type: \x1b[35m${client.colorCharacteristic ? "Color" : "White"}\x1b[0m`)
ui.log.write(`Turned On: \x1b[35m${await client.isOn()}\x1b[0m`)

// eslint-disable-next-line no-constant-condition
while(true){
    const { action } = await inquirer.prompt({
        type: "list",
        name: "action",
        message: "Select an action",
        choices: [
            {
                name: "Turn on",
                value: "turnOn"
            },
            {
                name: "Turn off",
                value: "turnOff"
            },
            {
                name: "Toggle",
                value: "toggle"
            },
            {
                name: "Get brightness",
                value: "getBrightness"
            },
            {
                name: "Set brightness",
                value: "setBrightness"
            },
            ...(client.colorCharacteristic ? [
                {
                    name: "Set color",
                    value: "setColor"
                },
                {
                    name: "Set RGB color",
                    value: "setRGBColor"
                },
                {
                    name: "Get color",
                    value: "getColor"
                }
            ] : []),
            {
                name: "Get temperature",
                value: "getTemperature"
            },
            {
                name: "Set temperature",
                value: "setTemperature"
            }, 
            {
                name: "Set lamp name",
                value: "setLampName"
            },
            {
                name: "Disconnect",
                value: "disconnect"
            }
        ]
    })
    
    switch(action){
        case "turnOn":
            await client.on()
            ui.log.write(`Turned On: \x1b[35m${await client.isOn()}\x1b[0m`)
            break
        case "turnOff":
            await client.off()
            ui.log.write(`Turned On: \x1b[35m${await client.isOn()}\x1b[0m`)
            break
        case "toggle":
            await client.toggle()
            ui.log.write(`Turned On: \x1b[35m${await client.isOn()}\x1b[0m`)
            break
        case "getBrightness":
            ui.log.write(`Brightness: \x1b[35m${await client.getBrightness()}\x1b[0m`)
            break
        case "setBrightness": {
            const { brightness } = await inquirer.prompt({
                type: "number",
                name: "brightness",
                message: "Enter brightness (0-100)",
                default: 100,
                filter: (value:number) => Math.max(0, Math.min(100, value))
            })
            await client.setBrightness(brightness)
            // wait for the brightness to change
            ui.log.write(`Brightness: \x1b[35m${brightness}\x1b[0m`)
            break
        }
        case "setColor": {
            const { color } = await inquirer.prompt({
                type: "input",
                name: "color",
                message: "Enter color (4 bytes)",
                default: convertRGB([255, 255, 255]).join(","),
                filter: (value:string) => value.split(",").map(v => parseInt(v.trim()))
            })
            await client.setColor(color)
            ui.log.write(`Color: \x1b[35m${color.join(",")}\x1b[0m`)
            break
        }
        case "setRGBColor": {
            const { rgb } = await inquirer.prompt({
                type: "input",
                name: "rgb",
                message: "Enter RGB color",
                default: "#ffffff",
                filter: (value:string) => value
            })
            await client.setRGBColor(rgb)
            ui.log.write(`Color: \x1b[35m${rgb}\x1b[0m`)
            break
        }
        case "getColor":
            ui.log.write(`Color: \x1b[35m${(await client.getColor()).join(",")}\x1b[0m`)
            break
        case "getTemperature":
            ui.log.write(`Temperature: \x1b[35m${await client.getTemperature()}\x1b[0m`)
            break
        case "setTemperature": {
            const { temperature } = await inquirer.prompt({
                type: "number",
                name: "temperature",
                message: "Enter temperature (0-100)",
                default: 50,
                filter: (value:number) => Math.max(0, Math.min(100, value))
            })
            await client.setTemperature(temperature)
            ui.log.write(`Temperature: \x1b[35m${temperature}\x1b[0m`)
            break
        }
        case "setLampName": {
            const { name } = await inquirer.prompt({
                type: "input",
                name: "name",
                message: "Enter lamp name",
                default: await client.getLampName(),
                filter: (value:string) => value
            })
            if(name === ""){
                ui.log.write("\x1b[31mPlease enter a valid name\x1b[0m")
                break
            }
            await client.setLampName(name)
            ui.log.write(`Lamp name: \x1b[35m${name}\x1b[0m`)
            break
        }
        case "disconnect":
            await client.disconnect()
            ui.log.write(`\x1b[31mDisconnected\x1b[0m`)
            process.exit(0)
    }
}
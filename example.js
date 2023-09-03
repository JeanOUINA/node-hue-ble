import { Client } from "./dist/index.js";

const scanner = await Client.scanForLamps()
scanner.on("discover", async peripheral => {
    console.log("Discovered peripheral", peripheral.advertisement.localName, peripheral.uuid)
    scanner.stopScanning()

    const lamp = new Client(peripheral)
    await lamp.connect()
    console.log("Connected to", await lamp.getLampName())

    await lamp.on()
    await lamp.setBrightness(100)
    await lamp.setRGBColor("f00")

    await lamp.disconnect()
    console.log("Disconnected")
    process.exit(0)
})
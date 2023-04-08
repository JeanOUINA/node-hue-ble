import { EEventEmitter } from "./events.js";
import noble from "@abandonware/noble"

export default class Scanner extends EEventEmitter<{
    discover: [noble.Peripheral]
}> {
    services:string[]
    private clean?:() => void
    constructor(services:string[]){
        super()
        this.services = services
    }

    async startScanning(){
        if(noble.state !== "poweredOn"){
            await new Promise<void>((resolve, reject) => {
                noble.once("stateChange", (state) => {
                    if(state === "poweredOn"){
                        resolve()
                    }else{
                        reject(new Error("Noble is not powered on"))
                    }
                })
            })
        }
        await noble.startScanningAsync(this.services, false)
        const listener = (peripheral) => {
            this.emit("discover", peripheral)
        }
        noble.on("discover", listener)
        this.clean = () => {
            noble.removeListener("discover", listener)
        }
    }

    async stopScanning(){
        await noble.stopScanningAsync()
        this.clean?.()
    }
}
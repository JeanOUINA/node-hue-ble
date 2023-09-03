import { EventEmitter } from "events"

export class EEventEmitter <events extends {
    [key: string]: any[]
}> extends EventEmitter {
    on<key extends keyof events>(event:Exclude<key, number>, listener:(...args:events[key]) => void){
        return super.on(event, listener as any)
    }
    once<key extends keyof events>(event:Exclude<key, number>, listener:(...args:events[key]) => void){
        return super.once(event, listener as any)
    }
    off<key extends keyof events>(event:Exclude<key, number>, listener:(...args:events[key]) => void){
        return super.off(event, listener as any)
    }
    removeListener<key extends keyof events>(event:Exclude<key, number>, listener:(...args:events[key]) => void){
        return super.removeListener(event, listener as any)
    }
    removeAllListeners<key extends keyof events>(event:Exclude<key, number>){
        return super.removeAllListeners(event)
    }
    rawListeners<key extends keyof events>(event:Exclude<key, number>):((...args:events[key]) => void)[]{
        return super.rawListeners(event) as any
    }
    addListener<key extends keyof events>(event:Exclude<key, number>, listener:(...args:events[key]) => void){
        return super.addListener(event, listener as any)
    }
    listenerCount<key extends keyof events>(event:Exclude<key, number>){
        return super.listenerCount(event)
    }
    emit<key extends keyof events>(event:Exclude<key, number>, ...args:events[key]){
        return super.emit(event, ...args)
    }
    eventNames():Exclude<keyof events, number>[]{
        return super.eventNames() as any
    }
    listeners<key extends keyof events>(event:Exclude<key, number>):((...args:events[key]) => void)[]{
        return super.listeners(event) as any
    }
    prependListener<key extends keyof events>(event:Exclude<key, number>, listener:(...args:events[key]) => void){
        return super.prependListener(event, listener as any)
    }
    prependOnceListener<key extends keyof events>(event:Exclude<key, number>, listener:(...args:events[key]) => void){
        return super.prependOnceListener(event, listener as any)
    }
}
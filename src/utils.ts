// based off https://github.com/npaun/philble/blob/master/philble/client.py#L87
export function convertRGB(rgb: number[]): number[] {
    if(!rgb.every(chan => 0 <= chan && chan <= 0xff) || rgb.length !== 3){
        throw new Error("Invalid rgb value");
    }

    const adjusted = rgb.map(chan => Math.floor(chan / 255 * 254 + 1));
    const total = adjusted.reduce((a, b) => a + b, 0);
    const data = adjusted.map(chan => Math.floor(chan / total * 0xfd + 1));

    return [1, data[0], data[2], data[1]];
}

export function wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function makePromise<T>(): [Promise<T>, (value: T) => void, (error: Error) => void] {
    let resolve: (value: T) => void;
    let reject: (error: Error) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return [promise, resolve!, reject!];
}
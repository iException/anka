export default function (fn: Function) {
    return function (...params: Array<any>) {
        const limitation = params.length

        return new Promise(resolve => {
            if (fn.length > limitation) {
                fn(...params, resolve)
            } else {
                resolve(fn(...params))
            }
        })
    }
}

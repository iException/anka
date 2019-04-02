export default function (fn: Function): (...params: Array<any>) => Promise<any> {
    return function (...params) {
        const limitation = params.length

        return new Promise(resolve => {
            if (fn.length > limitation) {
                fn(...params.concat(new Array(fn.length - limitation - 1).fill(undefined)), resolve)
            } else {
                fn(...params.splice(0, fn.length - 1), resolve)
            }
        })
    }
}

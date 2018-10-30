function wrapper(fn: (cb?: Function) => any, ...params: Array<any>) {
    const limitation = params.length

    return function () {
        return new Promise((resolve, reject) => {
            if (fn.length > limitation) {
                fn(...params, resolve)
            } else {
                resolve(fn(...params))
            }
        })
    }
}

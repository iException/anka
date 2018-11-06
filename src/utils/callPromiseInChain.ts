export default function callPromiseInChain (list: Array<(...params: any[]) => Promise<any>> = [], ...params: Array<any>) {
    return new Promise((resolve, reject) => {
        if (!list.length)  {
            resolve()
            return
        }
        let step = list[0](...params)

        for (let i = 1; i < list.length; i++) {
            step = step.then(function () {
                return list[i](...params)
            })
        }

        step.then(res => {
            resolve()
        }, err => {
            reject(err)
        })
    })
}

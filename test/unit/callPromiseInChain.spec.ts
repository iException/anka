import {
    logger,
    messager,
    callPromiseInChain,
} from '../../src/utils'
import * as path from 'path'

function taskCreator (len = 3) {
    return new Array(len).fill(null).map(() => {
        return function (params: Array<any>) {
            return new Promise((resolve, reject) => {
                params.forEach((item: any, index: number) => params[index]++)
                setTimeout(resolve, 0)
            })
        }
    })
}

describe('Utils:callPromiseInChain', () => {
    it('call promise in chain', done => {
        const params = [1, 2, 3]

        callPromiseInChain(taskCreator(3), params).then(() => {
            expect(params).toEqual([4, 5, 6])
            done()
        }).catch(err => console.error(err))
    })
})

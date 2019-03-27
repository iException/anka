import {
    asyncFunctionWrapper
} from '../../src/utils'
import * as path from 'path'

describe('Utils:asyncFunctionWrapper', () => {
    it('resolve one parameter', done => {
        const asycnFn = asyncFunctionWrapper(function (param: any, cb: any) {
            console.log(cb, param)
            setTimeout(cb, 10, param)
        })
        asycnFn(1).then(val => {
            expect(val).to.equal(1)
            done()
        }).catch(err => console.error(err))
    })

    it('overmany parameter', done => {
        const asycnFn = asyncFunctionWrapper(function (param: any, cb: any) {
            setTimeout(cb, 10, param)
        })
        asycnFn(1, 2).then(val => {
            expect(val).to.equal(1)
            done()
        }).catch(err => console.error(err))
    })

    it('deficient parameter', done => {
        const asycnFn = asyncFunctionWrapper(function (param: any, cb: any) {
            setTimeout(cb, 10, param)
        })
        asycnFn().then(val => {
            expect(val).to.equal(undefined)
            done()
        }).catch(err => console.error(err))
    })
})

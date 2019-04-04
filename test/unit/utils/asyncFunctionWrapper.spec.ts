import {
    asyncFunctionWrapper
} from '../../../src/utils'
import * as path from 'path'
import expect = require('expect')

describe('Utils:asyncFunctionWrapper', () => {
    it('one parameter', done => {
        const asycnFn = asyncFunctionWrapper(function (param: any, cb: any) {
            setTimeout(cb, 10, param)
        })
        asycnFn(1).then((...val) => {
            expect(val).toEqual([1])
            done()
        }).catch(err => console.error(err))
    })

    it('overmany parameter', done => {
        const asycnFn = asyncFunctionWrapper(function (param: any, cb: any) {
            setTimeout(cb, 10, param)
        })
        asycnFn(1, 2).then((...val) => {
            expect(val).toEqual([1])
            done()
        }).catch(err => console.error(err))
    })

    it('deficient parameter', done => {
        const asycnFn = asyncFunctionWrapper(function (param: any, cb: any) {
            setTimeout(cb, 10, param)
        })
        asycnFn().then((...val) => {
            expect(val).toEqual([undefined])
            done()
        }).catch(err => console.error(err))
    })
})

import * as path from 'path'
import { Messager } from '../../src/utils/messager'
import expect = require('expect')

describe('Utils:messager', () => {
    it('push message', () => {
        const messager = new Messager()

        messager.push(new Error('test error'))
        messager.push('test message')

        expect(messager.errors).toEqual([new Error('test error')])
        expect(messager.messages).toEqual(['test message'])
    })

    it('clear message', () => {
        const messager = new Messager()

        messager.push(new Error('test error'))
        messager.push('test message')
        messager.clear()

        expect(messager.errors).toEqual([])
        expect(messager.messages).toEqual([])
    })
})

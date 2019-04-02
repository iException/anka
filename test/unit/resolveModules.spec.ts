import {
    logger,
    messager,
    resolveModule,
} from '../../src/utils'
import * as path from 'path'

describe('Utils:resolveModule', () => {
    it('resolve npm module', () => {
        const module = resolveModule('typescript', {
            paths: [__dirname]
        })
        expect(module).toEqual(path.join(process.cwd(), 'node_modules/typescript/lib/typescript.js'))
    })
})

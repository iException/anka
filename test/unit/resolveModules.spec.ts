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
        expect(module).to.equal(path.join(process.cwd(), 'node_modules/typescript/lib/typescript.js'))
    })
})

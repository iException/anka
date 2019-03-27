import {
    logger,
    messager,
    resolveModule,
} from '../../src/utils'
import * as path from 'path'

describe('Utils', () => {
    it('resolveModule', () => {
        const module = resolveModule('typescript', {
            paths: [__dirname]
        })
        expect(module).to.equal(path.join(process.cwd(), 'node_modules/typescript/lib/typescript.js'))
    })
})

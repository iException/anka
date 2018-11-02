import * as acorn from 'acorn'
import * as acornWalker from 'acorn-walk'
import Acorn = require('acorn')
import { Compiler } from '../../core'

const dependencyPool = new Map<string, string>()

export default <Plugin> function (this: PluginInjection) {
    this.on('before-compile', function (compilation: Compilation, cb: Function) {
        const file = compilation.file

        // Only resolve js file.
        if (file.ast === void (0) && file.extname === '.js') {
            file.ast = acorn.parse(
                file.content instanceof Buffer ? file.content.toString() : file.content,
                {
                    sourceType: 'module'
                }
            )
        }
        file.ast
        cb()
        // const newCompthis.generateCompilation()
    } as PluginHandler)
}

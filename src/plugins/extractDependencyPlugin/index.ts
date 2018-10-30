import * as acorn from 'acorn'
import { Compiler } from '../../core'

const dependencyPool = new Map<string, string>()

export default <Plugin>function (this: PluginInjection) {
    this.on('after-parse', <PluginHandler>function (compilation: Compilation, cb: Function) {
        const file = compilation.file

        if (file.ast === void (0)) {
            file.ast = acorn.parse(
                file.content instanceof Buffer ? file.content.toString() : file.content,
                {
                    sourceType: 'module'
                }
            )
        }
        // const newCompthis.generateCompilation()
    })
}
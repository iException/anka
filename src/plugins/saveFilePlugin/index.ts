import { Compiler } from '../../core'
import { writeFile } from '../../utils/editor'

export default <Plugin>function (this: PluginInjection) {
    this.on('after-compile', <PluginHandler>function (compilation: Compilation, cb: Function) {
        const file = compilation.file

        // TODO: Use mem-fs
        writeFile(file.targetFile, file.content).then(() => {
            compilation.destroy()
        }, err => {
            compilation.destroy()
        })
    })
}

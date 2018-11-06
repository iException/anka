import * as utils from '../../utils'
import logger from '../../utils/logger'
import * as fs from 'fs-extra'

const { writeFile } = utils

export default <Plugin>function (this: PluginInjection) {
    this.on('after-compile', <PluginHandler>function (compilation: Compilation, cb: Function) {
        const file = compilation.file

        // TODO: Use mem-fs
        fs.ensureFile(file.targetFile).then(() => {
            return writeFile(file.targetFile, file.content)
        }).then(() => {
            compilation.destroy()
            cb()
        }, err => {
            logger.error('Error', err.message, err)
            compilation.destroy()
            cb()
        })
    })
}

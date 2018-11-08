import * as fs from 'fs-extra'
import config from '../../config'
import * as utils from '../../utils'
import logger from '../../utils/logger'

const { writeFile } = utils

export default <Plugin>function (this: PluginInjection) {
    this.on('after-compile', <PluginHandler>function (compilation: Compilation, cb: Function) {
        const file = compilation.file

        // TODO: Use mem-fs
        fs.ensureFile(file.targetFile).then(() => {
            const task = [
                writeFile(file.targetFile, file.content)
            ]
            if (config.ankaConfig.devMode && file.sourceMap) {
                task.push(writeFile(`${file.targetFile}.map`, file.sourceMap))
            }
            return Promise.all(task)
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

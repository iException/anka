import * as fs from 'fs-extra'
import config from '../../config'
import * as utils from '../../utils'
import logger from '../../utils/logger'

const inlineSourceMapComment = require('inline-source-map-comment')
const { writeFile } = utils

export default <Plugin>function (this: PluginInjection) {
    this.on('after-compile', <PluginHandler>function (compilation: Compilation, cb: Function) {
        const file = compilation.file

        // TODO: Use mem-fs
        fs.ensureFile(file.targetFile).then(() => {
            // if (config.ankaConfig.devMode && file.sourceMap) {
            //     file.content = file.content instanceof Buffer ? file.content.toString() : file.content
            //     file.content = file.content + '\r\n' + inlineSourceMapComment(file.sourceMap)
            // }
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

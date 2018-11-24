import * as fs from 'fs-extra'
import {
    Plugin,
    Compilation,
    PluginHandler,
    PluginInjection
} from '../../../types/types'
const minifyJSON = require('jsonminify')
const inlineSourceMapComment = require('inline-source-map-comment')

export default <Plugin>function (this: PluginInjection) {
    const utils = this.getUtils()
    const config = this.getSystemConfig()
    const {
        logger,
        writeFile
    } = utils

    this.on('after-compile', <PluginHandler>function (compilation: Compilation, cb: Function) {
        const file = compilation.file

        // TODO: Use mem-fs
        fs.ensureFile(file.targetFile).then(() => {
            if (config.ankaConfig.devMode && file.sourceMap) {
                file.convertContentToString()
                file.content = file.content + '\r\n\r\n' + inlineSourceMapComment(file.sourceMap, {
                    block: true,
                    sourcesContent: true
                })
            }
            if (!config.ankaConfig.devMode) {
                switch (file.extname) {
                    // case '.js':
                    //     break;
                    case '.json':
                        file.convertContentToString()
                        file.content = minifyJSON(file.content)
                        break
                }
            }
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

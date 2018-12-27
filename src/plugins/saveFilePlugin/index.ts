import * as fs from 'fs-extra'
import {
    Plugin,
    Compilation,
    PluginHandler,
    PluginInjection
} from '../../../types/types'
const UglifyJS = require('uglify-js')
const minifyJSON = require('jsonminify')

const inlineSourceMapComment = require('inline-source-map-comment')

export default <Plugin>function (this: PluginInjection) {
    const utils = this.getUtils()
    const config = this.getSystemConfig()
    const {
        logger,
        writeFile
    } = utils

    this.on('save', <PluginHandler>function (compilation: Compilation, cb: Function) {
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
            if (config.ankaConfig.debug) {
                logger.info('Saving', file.targetFile)
            }
            return writeFile(file.targetFile, file.content)
        }).then(() => {
            cb()
        }).catch((err: Error) => {
            logger.error('Error', err.message, err)
            cb()
        })
    })
}

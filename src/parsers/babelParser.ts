import * as path from 'path'
import config from '../config'
import * as utils from '../utils'
import * as babel from '@babel/core'
import File from '../core/class/File'

import {
    Parser,
    Compilation,
    ParserInjection
} from '../../types/types'

let babelConfig = <babel.TransformOptions>null

/**
 * Script File parser.
 * @for .js .es
 */
export default <Parser>function (this: ParserInjection, file: File, compilation: Compilation, cb: Function) {
    if (file.isInSrcDir) {
        if (!babelConfig) {
            babelConfig = <babel.TransformOptions>utils.resolveConfig(['babel.config.js'], config.cwd)
        }

        file.content = file.content instanceof Buffer ? file.content.toString() : file.content

        const result = babel.transformSync(file.content, {
            babelrc: false,
            filename: file.sourceFile,
            sourceType: 'module',
            sourceMaps: config.ankaConfig.devMode,
            ...babelConfig
        })

        file.sourceMap = JSON.stringify(result.map)
        file.content = result.code
    }

    file.updateExt('.js')
    cb()
}

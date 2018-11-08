import * as path from 'path'
import config from '../config'
import * as utils from '../utils'
import * as babel from '@babel/core'
import File from '../core/class/File'

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

        const result = babel.transform(file.content, {
            babelrc: false,
            filename: file.sourceFile,
            sourceType: 'module',
            sourceMaps: config.ankaConfig.devMode ? 'inline' : false,
            ...babelConfig
        })

        file.content = result.code
    }

    file.updateExt('.js')
    cb()
}

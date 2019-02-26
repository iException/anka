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
    const utils = this.getUtils()
    const config = this.getSystemConfig()

    if (file.isInSrcDir) {
        if (!babelConfig) {
            babelConfig = <babel.TransformOptions>utils.resolveConfig(['babel.config.js'], config.cwd)
        }

        file.convertContentToString()

        try {
            const result = babel.transformSync(<string>file.content, {
                babelrc: false,
                ast: true,
                filename: file.sourceFile,
                sourceType: 'module',
                sourceMaps: config.ankaConfig.devMode,
                comments: config.ankaConfig.devMode,
                minified: !config.ankaConfig.devMode,
                ...babelConfig
            })

            file.sourceMap = JSON.stringify(result.map)
            file.content = result.code
            file.ast = result.ast
        } catch (err) {
            compilation.destroy()
            utils.logger.error('Compile', file.sourceFile, err)
        }
    }

    file.updateExt('.js')
    cb()
}

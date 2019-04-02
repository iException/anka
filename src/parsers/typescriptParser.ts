import * as ts from 'typescript'

import {
    File,
    Parser,
    Compilation,
    ParserInjection
} from '../../types/types'

let tsConfig = <ts.TranspileOptions>null

/**
 * Typescript file parser.
 *
 * @for any file that does not matche parsers.
 */
export default <Parser>function (this: ParserInjection, file: File, compilation: Compilation, callback?: Function) {
    const utils = this.getUtils()
    const config = this.getSystemConfig()
    const { logger } = utils

    file.content = file.content instanceof Buffer ? file.content.toString() : file.content
    const sourceMap =  {
        sourcesContent: [file.content]
    }

    if (!tsConfig) {
        tsConfig = <ts.TranspileOptions>utils.resolveConfig(['tsconfig.json', 'tsconfig.js'], config.cwd)
    }

    const result = ts.transpileModule(file.content, {
        compilerOptions: tsConfig.compilerOptions,
        fileName: file.sourceFile
    })

    try {
        file.content = result.outputText
        if (config.ankaConfig.devMode) {
            file.sourceMap = {
                ...JSON.parse(result.sourceMapText),
                ...sourceMap
            }
        }
        file.updateExt('.js')
    } catch (err) {
        logger.error('Compile', file.sourceFile, err)
        compilation.destroy()
    }

    callback()
}

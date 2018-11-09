import * as path from 'path'
import config from '../config'

import {
    File,
    Parser,
    Compilation,
    ParserInjection
} from '../../types/types'

/**
 * Unknow type file parser.
 * @for any file that does not matche parsers.
 */
export default <Parser>function (this: ParserInjection, file: File, compilation: Compilation, callback?: Function) {
    // file.targetFile = file.targetFile.replace(config.srcDir, config.distDir)
    callback()
}

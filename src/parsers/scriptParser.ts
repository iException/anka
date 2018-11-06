import * as path from 'path'
import config from '../config'
import File from '../core/class/File'

/**
 * Script File parser.
 * @for .js .es
 */
export default <Parser>function (this: ParserInjection, file: File, compilation: Compilation, cb: Function) {
    // this.resourceType = RESOURCE_TYPE.OTHER
    // file.targetFile = file.targetFile.replace(config.srcDir, config.distDir)
    file.updateExt('.js')
    cb()
}

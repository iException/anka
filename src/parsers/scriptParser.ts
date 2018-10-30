import * as path from 'path'
import config from '../config'
import File from '../core/class/File'
import Compilation from '../core/class/Compilation'

/**
 * Script File parser.
 * @for .js .es
 */
export default <Parser>function (this: ParserInjection, file: File, options: ParserOption) {
    // this.resourceType = RESOURCE_TYPE.OTHER
    file.targetFile = file.targetFile.replace(config.srcDir, config.distDir)
    file.updateExt('.js')
}

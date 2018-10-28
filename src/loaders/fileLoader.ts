import * as path from 'path'
import config from '../config'
import File from '../core/class/File'
import Compilation from '../core/class/Compilation'

export default function (this: Compilation, file: File, options: LoaderOption) {
    this.resourceType = RESOURCE_TYPE.OTHER
    file.targetFile = file.targetFile.replace(config.srcDir, config.distDir)
}

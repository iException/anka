
import path = require('path')
import config from '../config'
import File from '../core/class/File'


/**
 * Template file parser.
 * @for .wxml .html => .wxml
 */
export default <Parser>function (this: ParserInjection, file: File, callback: Function) {
    file.targetFile = file.targetFile.replace(config.srcDir, config.distDir)
}

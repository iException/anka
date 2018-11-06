import config from '../config'
import * as utils from '../utils'
import * as sass from 'node-sass'
import File from '../core/class/File'

/**
 * Sass file parser.
 * @for any file that does not matche parsers.
 */
export default <Parser>function (this: ParserInjection, file: File, compilation: Compilation, callback?: Function) {
    file.content = file.content instanceof Buffer ? file.content.toString() : file.content

    sass.render({
        file: file.sourceFile,
        data: file.content,
        outputStyle: !config.ankaConfig.devMode ? 'nested' : 'compressed'
    }, (err: Error, result: any) => {
        if (err) {
            utils.logger.error('Compile', err.message, err)
        } else {
            file.content = result.css
            file.updateExt('.wxss')
        }
        callback()
    })
}

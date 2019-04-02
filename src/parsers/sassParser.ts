import * as sass from 'node-sass'

import {
    File,
    Parser,
    Compilation,
    ParserInjection
} from '../../types/types'

/**
 * Sass file parser.
 * @for any file that does not matche parsers.
 */
export default <Parser>function (this: ParserInjection, file: File, compilation: Compilation, callback?: Function) {
    const utils = this.getUtils()
    const config = this.getSystemConfig()

    file.content = file.content instanceof Buffer ? file.content.toString() : file.content

    sass.render({
        file: file.sourceFile,
        data: file.content
    }, (err: Error, result: any) => {
        if (err) {
            utils.logger.error('Compile', file.sourceFile, err)
            compilation.destroy()
        } else {
            file.content = result.css
            file.updateExt('.wxss')
        }
        callback()
    })
}

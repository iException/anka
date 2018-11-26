import * as Postcss from 'postcss'
import postcssrc from 'postcss-load-config'

import {
    File,
    Parser,
    Compilation,
    ParserInjection
} from '../../../types/types'
import * as PostCSS from 'postcss'

const postcss = require('postcss')
const postcssConfig: any = {}

/**
 * Style file parser.
 * @for .wxss .css => .wxss
 */
export default <Parser>function (this: ParserInjection, file: File, compilation: Compilation, cb: Function): void {
    const internalPlugins: Array<PostCSS.AcceptedPlugin> = []

    genPostcssConfig().then((config: any) => {
        file.convertContentToString()

        return postcss(config.plugins.concat(internalPlugins)).process(file.content, {
            ...config.options,
            from: file.sourceFile
        } as Postcss.ProcessOptions)
    }).then((root: Postcss.Result) => {
        file.content = root.css
        file.ast = root.root.toResult()
        file.updateExt('.wxss')
        cb()
    })
}


function genPostcssConfig () {
    return postcssConfig.plugins ? Promise.resolve(postcssConfig) : postcssrc({}).then((config: any) => {
        return Promise.resolve(Object.assign(postcssConfig, config))
    })
}

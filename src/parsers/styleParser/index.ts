import * as Postcss from 'postcss'
import postcssrc from 'postcss-load-config'
import postcssWxImport from './postcssWximport'

import {
    File,
    Parser,
    Compilation,
    ParserInjection
} from '../../../types/types'

const cssnano = require('cssnano')
const postcss = require('postcss')
const postcssConfig: any = {}

/**
 * Style file parser.
 * @for .wxss .css => .wxss
 */
export default <Parser>function (this: ParserInjection, file: File, compilation: Compilation, cb: Function): void {
    const config = this.getSystemConfig()
    const internalPlugins = [postcssWxImport]

    if (!config.ankaConfig.devMode) {
        internalPlugins.push(cssnano)
    }
    genPostcssConfig().then((config: any) => {
        file.content = file.content instanceof Buffer ? file.content.toString() : file.content

        return postcss(config.plugins.concat(internalPlugins)).process(file.content, {
            ...config.options,
            from: file.sourceFile
        } as Postcss.ProcessOptions)
    }).then((root: Postcss.LazyResult) => {
        file.content = root.css
        file.updateExt('.wxss')
        cb()
    })
}


function genPostcssConfig () {
    return postcssConfig.plugins ? Promise.resolve(postcssConfig) : postcssrc({}).then((config: any) => {
        return Promise.resolve(Object.assign(postcssConfig, config))
    })
}

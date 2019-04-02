import {
    File,
    Parser,
    Compilation,
    ParserInjection
} from '../../../types/types'
import * as Postcss from 'postcss'
import logger from '../../utils/logger'

const postcssrc = require('postcss-load-config')
const postcss = require('postcss')
const postcssConfig: any = {}
const internalPlugins: Array<Postcss.AcceptedPlugin> = []
const tasks: any[] = []

// TODO: Add new hook: preset

/**
 * Style file parser.
 * @for .wxss .css => .wxss
 */
export default <Parser>function (this: ParserInjection, file: File, compilation: Compilation, cb: Function): void {
    if (postcssConfig.plugins) {
        exec(postcssConfig, file, compilation, cb)
    } else {
        tasks.push(() => {
            exec(postcssConfig, file, compilation, cb)
        })
    }
}

genPostcssConfig().then((config: any) => {
    tasks.forEach((task: Function) => task())
}).catch((err: Error) => {
    logger.error('loadConfig', err.message, err)
})


function exec (config: any, file: File, compilation: Compilation, cb: Function) {
    file.convertContentToString()
    postcss(config.plugins.concat(internalPlugins)).process(file.content, {
        ...config.options,
        from: file.sourceFile
    } as Postcss.ProcessOptions).then((root: Postcss.Result) => {
        file.content = root.css
        file.ast = root.root.toResult()
        file.updateExt('.wxss')
        cb()
    }).catch((err: Error) => {
        logger.error('Compile', file.sourceFile, err)
        compilation.destroy()
        cb()
    })
}

function genPostcssConfig (tasks: Function[] = []) {
    return postcssConfig.plugins ? Promise.resolve(postcssConfig) : postcssrc({}).then((config: any) => {
        return Promise.resolve(Object.assign(postcssConfig, config))
    })
}

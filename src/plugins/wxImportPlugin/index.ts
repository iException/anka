import * as fs from 'fs-extra'
import {
    Plugin,
    Compilation,
    PluginHandler,
    PluginInjection
} from '../../../types/types'
import * as PostCSS from 'postcss'
import postcssWxImport from './postcssWximport'

const postcss = require('postcss')
const cssnano = require('postcss-normalize-whitespace')
const internalPlugins: Array<PostCSS.AcceptedPlugin> = [postcssWxImport]

export default <Plugin>function (this: PluginInjection) {
    const utils = this.getUtils()
    const {
        logger
    } = utils
    const config = this.getSystemConfig()
    const testSrcDir = new RegExp(`^${config.srcDir}`)

    this.on('before-compile', <PluginHandler>function (compilation: Compilation, cb: Function) {
        const file = compilation.file

        if (!config.ankaConfig.devMode) {
            internalPlugins.push(cssnano)
        }

        const handler = postcss(internalPlugins)

        if (file.extname === '.wxss' && testSrcDir.test(file.sourceFile)) {
            handler.process((file.ast || file.content) as string | { toString (): string; } | PostCSS.Result, {
                from: file.sourceFile
            } as PostCSS.ProcessOptions).then((root: PostCSS.Result): void => {
                file.content = root.css
                file.ast = root.root.toResult()
                cb()
            }, (err: Error) => {
                logger.error('Error', err.message, err)
                compilation.destroy()
                cb()
            })
        } else {
            cb()
        }
    })
}

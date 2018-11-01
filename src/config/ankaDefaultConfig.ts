// import path = require('path')
import * as path from 'path'
import fileParser from '../parsers/fileParser'
import scriptParser from '../parsers/scriptParser'
import styleParser from '../parsers/styleParser'
import templateParser from '../parsers/templateParser'
import saveFilePlugin from '../plugins/saveFilePlugin'
import extractDependencyPlugin from '../plugins/extractDependencyPlugin'


/*****************************************************
 *                   Danger zone
 *****************************************************/

/**
 * The path where WeChat miniprogram source files exist.
 * @default './src'
 */
export const sourceDir = './src'

/**
 * The path where WeChat miniprogram compiled files exist.
 * @default './dist'
 */
export const outputDir = './dist'

/**
 * The path where WeChat miniprogram pages exist.
 * @default './src/pages'
 */
export const pages = path.join(sourceDir, 'pages')

/**
 * The path where WeChat miniprogram components exist.
 * @default './src/components'
 */
export const components = path.join(sourceDir, 'components')


/*****************************************************
 *                 Custom configure
 *****************************************************/

/**
 * Whether to output compile information.
 * @default false
 */
export const silent = false

/**
 * Anka development mode.
 * @default false
 */
export const devMode = false

/**
 * Register file parser.
 */
export const parsers: ParsersConfigration = [
    {
        match: /.*\.(js|es)$/,
        parsers: [
            {
                parser: scriptParser,
                options: {}
            }
        ]
    },
    {
        match: /.*\.(wxss|css|postcss)$/,
        parsers: [
            {
                parser: styleParser,
                options: {}
            }
        ]
    }
]

/**
 * Whether to output debug information.
 * @default false
 */
export const debug = false

/**
 * Register plugin.
 */
export const plugins: PluginsConfigration = [
    {
        plugin: extractDependencyPlugin,
        options: {}
    },
    {
        plugin: saveFilePlugin,
        options: {}
    }
]


/*****************************************************
 *               experimental configure
 *****************************************************/


import * as path from 'path'

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
 * Register file loader.
 */
export const module: Array<LoaderOption> = []

/**
 * Whether to output debug information.
 * @default false
 */
export const debug = false


/*****************************************************
 *               experimental configure
 *****************************************************/


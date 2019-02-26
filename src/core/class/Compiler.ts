import {
    ParserInjection,
    PluginInjection
} from './Injection'
import File from './File'
import * as path from 'path'
import * as fs from 'fs-extra'
import config from '../../config'
import * as utils from '../../utils'
import Compilation from './Compilation'
import messager from '../../utils/messager'
import callPromiseInChain from '../../utils/callPromiseInChain'
import asyncFunctionWrapper from '../../utils/asyncFunctionWrapper'

import {
    Parser,
    ParserOptions,
    PluginHandler,
    PluginOptions,
    CompilerConfig
} from '../../../types/types'

const { logger } = utils
const del = require('del')

/**
 * The core compiler.
 */
export default class Compiler {
    readonly config: CompilerConfig
    public static compilationId = 1
    public static compilationPool = new Map<string, Compilation>()
    plugins: {
        [eventName: string]: Array<PluginHandler>
    } = {
        'before-load-file': [],
        'after-load-file': [],
        'before-parse': [],
        'after-parse': [],
        'before-compile': [],
        'after-compile': [],
        'save': []
    }
    parsers: Array<{
        match: RegExp,
        parsers: Array<Parser>
    }> = []

    constructor () {
        this.config = config
        this.initParsers()
        this.initPlugins()

        if (config.ankaConfig.debug) {
            console.log(JSON.stringify(this.config, (key, value) => {
                if (value instanceof Function) return '[Function]'
                return value
            }, 4))
        }
    }

    /**
     * Register Plugin.
     * @param event
     * @param handler
     */
    on (event: string, handler: PluginHandler): void {
        if (this.plugins[event] === void (0)) throw new Error(`Unknown hook: ${event}`)
        this.plugins[event].push(handler)
    }

    /**
     * Invoke lifecycle hooks(Promise chaining).
     * @param event
     * @param compilation
     */
    async emit (event: string, compilation: Compilation): Promise<any> {
        if (compilation.destroyed) return

        const plugins = this.plugins[event]

        if (!plugins || !plugins.length) return

        const tasks = plugins.map(plugin => {
            return asyncFunctionWrapper(plugin)
        })

        try {
            await callPromiseInChain(tasks, compilation)
        } catch (e) {
            utils.logger.error('Compile', e.message, e)
        }
    }

    /**
     * Clean dist directory.
     */
    async clean (): Promise<void> {
        await del([
            path.join(config.distDir, '**/*'),
            `!${path.join(config.distDir, 'app.js')}`,
            `!${path.join(config.distDir, 'app.json')}`,
            `!${path.join(config.distDir, 'project.config.json')}`
        ])
        logger.success('Clean workshop', config.distDir)
    }

    /**
     * Everything start from here.
     */
    async launch (): Promise<any> {
        logger.startLoading('Launching...')

        const startupTime = Date.now()
        const filePaths: string[] = await utils.searchFiles(`**/*`, {
            cwd: config.srcDir,
            nodir: true,
            silent: false,
            absolute: true,
            ignore: config.ankaConfig.ignored
        })
        const files = await Promise.all(filePaths.map(file => {
            return utils.createFile(file)
        }))
        const compilations = files.map(file => {
            return new Compilation(file, this.config, this)
        })

        fs.ensureDirSync(config.distNodeModules)

        // await Promise.all(compilations.map(compilation => compilation.loadFile()))
        // await Promise.all(compilations.map(compilation => compilation.invokeParsers()))

        // TODO: Get all files
        // Compiler.compilationPool.values()

        await Promise.all(compilations.map(compilations => compilations.run()))

        if (messager.hasError()) {
            messager.printError()
        } else {
            logger.success('Compiled' , `${files.length} files in ${Date.now() - startupTime}ms`)
            config.ankaConfig.debug && messager.printInfo()
        }
    }

    watchFiles (): Promise<any> {
        return new Promise(resolve => {
            const watcher = utils.genFileWatcher(`${config.srcDir}/**/*`, {
                followSymlinks: false,
                ignored: config.ankaConfig.ignored
            })

            watcher.on('add', async (fileName: string) => {
                logger.startLoading(`Compiling ${fileName}`)
                const startupTime = Date.now()
                const file = await utils.createFile(fileName)

                await this.generateCompilation(file).run()

                if (messager.hasError()) {
                    messager.printError()
                } else {
                    logger.success('Compiled ', `${fileName} in ${Date.now() - startupTime}ms`)
                    messager.printInfo()
                }
            })
            watcher.on('unlink', async (fileName: string) => {
                await fs.unlink(fileName.replace(config.srcDir, config.distDir))
                logger.success('Remove', fileName)
            })
            watcher.on('change', async (fileName: string) => {
                logger.startLoading(`Compiling ${fileName}`)
                const startupTime = Date.now()
                const file = await utils.createFile(fileName)

                await this.generateCompilation(file).run()

                if (messager.hasError()) {
                    messager.printError()
                } else {
                    logger.success('Compiled', `${fileName} in ${Date.now() - startupTime}ms`)
                    messager.printInfo()
                }
            })
            watcher.on('ready', () => {
                resolve()
                logger.log('Anka is waiting for changes...')
            })
        })
    }

    /**
     * Create new Compilation.
     * @param file
     */
    generateCompilation (file: File) {
        return new Compilation(file, this.config, this)
    }

    /**
     * Mount parsers.
     */
    initParsers (): void {
        this.config.ankaConfig.parsers.forEach(({ match, parsers }) => {
            this.parsers.push({
                match,
                parsers: parsers.map(({ parser, options }) => {
                    return parser.bind(this.generateParserInjection(options))
                })
            })
        })
    }

    /**
     * Mount Plugins.
     */
    initPlugins (): void {
        this.config.ankaConfig.plugins.forEach(({ plugin, options }) => {
            plugin.call(this.generatePluginInjection(options))
        })
    }

    generatePluginInjection (options: PluginOptions['options']): PluginInjection {
        return new PluginInjection(this, options)
    }

    generateParserInjection (options: ParserOptions['options']): ParserInjection {
        return new ParserInjection(this, options)
    }
}

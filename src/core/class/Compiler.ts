import {
    logger
} from '../../utils'
import {
    ParserInjection,
    PluginInjection
} from './Injection'
import File from './File'
import config from '../../config'
import * as utils from '../../utils'
import Compilation from './Compilation'
import callPromiseInChain from '../../utils/callPromiseInChain'
import asyncFunctionWrapper from '../../utils/asyncFunctionWrapper'

/**
 * The core complier
 */
export default class Compiler {
    readonly config: CompilerConfig
    public static compilationId = 1
    public static compilationPool = new Map<string, Compilation>()
    plugins: {
        [eventName: string]: Array<PluginHandler>
    } = {}
    parsers: Array<{
        match: RegExp,
        parsers: Array<Parser>
    }> = []

    constructor () {
        this.config = config
        this.initParsers()
        this.initPlugins()

        if (config.ankaConfig.debug) {
            console.log(JSON.stringify(this.config, null, 4))
        }
    }

    /**
     * Register Plugin.
     * @param event
     * @param handler
     */
    on (event: string, handler: PluginHandler): void {
        this.plugins[event].push(handler)
    }

    /**
     * Invoke lifecycle hooks(Promise chaining).
     * @param event
     * @param compilation
     */
    async emit (event: string, compilation: Compilation): Promise<any> {
        const plugins = this.plugins[event]

        if (!plugins || !plugins.length) return

        const tasks = plugins.map(plugin => {
            return asyncFunctionWrapper(plugin)
        })

        await callPromiseInChain(tasks, compilation)
    }

    async launch (): Promise<any> {
        const filePaths: string[] = await utils.searchFiles(`${config.srcDir}/**/*`)
        const files = await Promise.all(filePaths.map(file => {
            return utils.createFile(file)
        }))

        logger.info('Resolving files...')

        const compilations = files.map(file => {
            return this.generateCompilation(file)
        })

        await Promise.all(compilations.map(compilation => compilation.loadFile()))
        await Promise.all(compilations.map(compilation => compilation.invokeParsers()))

        // Get all files
        // Compiler.compilationPool.values()

        logger.info('Saving files...')
        await Promise.all(compilations.map(compilations => compilations.compile()))
    }

    watchFiles (): void {
        // utils.

    }

    generateCompilation (file: File) {
        return new Compilation(file, this.config, this)
    }

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

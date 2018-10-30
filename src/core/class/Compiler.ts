import {
    logger
} from '../../utils'
import File from './File'
import Compilation from './Compilation'
import config from '../../config'
import * as utils from '../../utils'

/**
 * The core complier
 */
export default class Compiler {
    readonly config: object
    public static compilationId = 1
    public static compilationPool = new Map<string, Compilation>()
    plugins: {
        [eventName: string]: Array<PluginHandler>
    }
    parsers: {
        test: RegExp,
        parsers: Array<Parser>
    }

    constructor () {
        this.config = config

        if (config.ankaConfig.debug) {
            console.log(this.config)
        }

        this.initParsers()
        this.initPlugins()
    }

    on (event: string, handler: PluginHandler): void {
        this.plugins[event].push(handler)
    }

    async emit (event: string, compilation: Compilation): Promise<any> {
        const plugins = this.plugins[event]

        if (!plugins || !plugins.length) return

        const tasks = plugins.map(handler => {
            return new Promise
        })

        await new Promise((resolve, reject) => {
            for (let i = 0; i < plugins.length; i++) {
                plugins[i](compilation, )
            }
            resolve()
        })
    }

    async launch (): Promise<any> {
        const filePaths: string[] = await utils.searchFiles(`${config.srcDir}/**/*`)
        const files = await Promise.all(filePaths.map(file => {
            return utils.createFile(file)
        }))

        logger.info('Resolving files...')

        files.map(file => {
            this.generateCompilation(file)
        })
    }

    generateCompilation (file: File) {
        const compilation = new Compilation(file, this.config, this)
        return compilation
    }



    initParsers (): void {

    }

    initPlugins (): void {

    }
}

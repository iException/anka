import {
    logger
} from '../../utils'
import File from './File'
import Compilation from './Compilation'
import config from '../../config'
import * as utils from '../../utils'
import { log } from 'util';

/**
 * The core complier
 */
export default class Compiler {
    readonly config: object
    public static compilationId = 1
    public static compilationPool = new Map<string, Compilation>()
    plugins: {
        [eventName: string]: Array<Plugin>
    }
    loaders: {
        test: RegExp,
        loaders: Array<Loader>
    }

    constructor () {
        this.config = config

        if (config.ankaConfig.debug) {
            console.log(this.config)
        }

        this.initLoaders()
        this.initPlugins()
    }

    on (event: string, handler: (c: Compilation) => void): void {

    }

    emit (event: string, compilation: Compilation): void {

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



    initLoaders (): void {

    }

    initPlugins (): void {

    }
}

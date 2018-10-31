import config from '../../config'
import Compiler from './Compiler'
import Compilation from './Compilation'

export abstract class Injection {
    compiler: Compiler
    options: object

    constructor (compiler: Compiler, options?: object) {
        this.compiler = compiler
        this.options = options
    }

    abstract getOptions (): object

    getAnkaConfig (): object {
        return config.ankaConfig
    }

    getSystemConfig (): object {
        return config
    }

    getProjectConfig (): object {
        return config.projectConfig
    }
}

export class PluginInjection extends Injection {

    constructor (compiler: Compiler, options: PluginOptions['options']) {
        super(compiler, options)
    }

    /**
     * Return Plugin options
     */
    getOptions (): object {
        return this.options || {}
    }

    on (event: string, handler: PluginHandler): void {
        this.compiler.on(event, handler)
    }
}

export class ParserInjection extends Injection {

    /**
     * Return ParserOptions
     */
    getOptions (): object {
        return this.options || {}
    }

    constructor (compiler: Compiler, options: ParserOptions['options']) {
        super(compiler, options)
    }
}

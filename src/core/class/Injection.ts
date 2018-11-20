import Compiler from './Compiler'
import config from '../../config'
import * as utils from '../../utils'

import {
    Utils,
    AnkaConfig,
    ParserOptions,
    ProjectConfig,
    PluginHandler,
    PluginOptions,
    CompilerConfig
} from '../../../types/types'

export abstract class Injection {
    compiler: Compiler
    options: object

    constructor (compiler: Compiler, options?: object) {
        this.compiler = compiler
        this.options = options
    }

    abstract getOptions (): object

    getCompiler (): Compiler {
        return this.compiler
    }

    getUtils () {
        return utils
    }

    getAnkaConfig (): AnkaConfig {
        return config.ankaConfig
    }

    getSystemConfig (): CompilerConfig {
        return config
    }

    getProjectConfig (): ProjectConfig {
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

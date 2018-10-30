import config from '../../config'

export class Injection {
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
    compiler: Compiler

    constructor (compiler: Compiler) {
        super()
        this.compiler = compiler
    }

    on (event: string, handler: PluginHandler): void {
        this.compiler.on(event, handler)
    }
}

export class ParserInjection extends Injection {
    compilation: Compilation

    constructor (compilation: Compilation) {
        super()
        this.compilation = compilation
    }
}

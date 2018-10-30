import File from './File'
import config from '../../config'
import Compiler from './Compiler'
import * as utils from '../../utils'

/**
 * A compilation task
 */
export default class Compilation {
    readonly config: object
    readonly compiler: Compiler
    id: number        // Unique，for each Compilation
    file: File
    sourceFile: string
    // targetFile: string
    // ast: Object | undefined
    resourceType: RESOURCE_TYPE
    parsers: Array<Parser>

    // Status，
    destroyed: boolean

    constructor (file: File | string, conf: object, compiler: Compiler) {
        this.compiler = compiler
        this.config = conf
        this.id = Compiler.compilationId++

        if (file instanceof File) {
            this.file = file
            this.sourceFile = file.sourceFile
        } else {
            this.sourceFile = file
        }

        this.register()
    }

    async run (): Promise<void> {
        await this.loadFile()
        await this.invokeParsers()
        await this.compile()
    }

    async loadFile (): Promise<void> {
        this.compiler.emit('before-load-file', this)
        if (!(this.file instanceof File)) {
            this.file = await utils.createFile(this.sourceFile)
        }
        this.compiler.emit('after-load-file', this)
    }

    async invokeParsers (): Promise<void> {
        await this.compiler.emit('before-parse', this)
        // TODO: Parser only excutes once
        await this.compiler.emit('after-parse', this)
    }

    async compile (): Promise<void> {
        await this.compiler.emit('compile', this)
        await this.compiler.emit('completed', this)
    }


    /**
     * Register on Compiler and destroy the previous one if conflict arises.
     */
    register () {
        const oldCompilation = Compiler.compilationPool.get(this.sourceFile)

        if (oldCompilation) {
            if (config.ankaConfig.debug) console.log('Destroy Compilation', oldCompilation.id, oldCompilation.sourceFile)

            oldCompilation.destroy()
        }
        Compiler.compilationPool.set(this.sourceFile, this)
    }

    /**
     * Unregister themselves from Compiler.
     */
    destroy () {
        this.destroyed = true
        Compiler.compilationPool.delete(this.sourceFile)
    }
}

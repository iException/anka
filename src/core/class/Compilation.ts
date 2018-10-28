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
    loaders: Array<Loader>

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

    // run () {
    //     this.parse()
    // }

    // parse () {
    //     this.loadFile()
    //     this.invokeLoaders()
    // }

    invokeLoaders () {
        this.compiler.emit('before-parse', this)
        // TODO: Loader only excutes once
        this.compiler.emit('after-parse', this)
    }

    async loadFile () {
        if (!(this.file instanceof File)) {
            this.file = await utils.createFile(this.sourceFile)
        }
        this.compiler.emit('after-load-file', this)
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

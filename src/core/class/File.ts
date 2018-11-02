import * as path from 'path'
import * as acorn from 'acorn'
import config from '../../config'

const replaceExt = require('replace-ext')

export default class File {
    public sourceFile: string
    public content: Content
    public targetFile: string
    public ast?: acorn.Node
    public sourceMap?: Content

    constructor (option: FileConstructorOption) {
        if (!option.sourceFile) throw new Error('Invalid value: FileConstructorOption.sourceFile')
        if (!option.content) throw new Error('Invalid value: FileConstructorOption.content')

        this.sourceFile = option.sourceFile
        this.targetFile = option.targetFile || option.sourceFile.replace(config.srcDir, config.distDir) // Default value
        this.content = option.content
        this.sourceMap = option.sourceMap
    }

    get dirname () {
        return path.dirname(this.sourceFile)
    }

    get basename () {
        return path.basename(this.sourceFile)
    }

    get extname () {
        return path.extname(this.sourceFile)
    }

    saveTo (path: string): void {
        // TODO
        if (!path) {
            throw new Error('Invalid path')
        }
    }

    updateExt (ext: string): void {
        this.targetFile = replaceExt(this.targetFile, ext)
    }
}

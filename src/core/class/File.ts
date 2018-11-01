import path = require('path')
import acorn = require('acorn')
import config from '../../config'
import replaceExt = require('replace-ext')

export default class File {
    public sourceFile: string
    public content: Content
    public targetFile: string
    public ast?: object
    public sourceMap?: Content

    constructor (option: FileConstructorOption) {
        if (!this.sourceFile) throw new Error('invalid value: FileConstructorOption.sourceFile')
        if (!this.content) throw new Error('invalid value: FileConstructorOption.content')

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

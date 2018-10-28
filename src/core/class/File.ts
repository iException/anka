
import * as path from 'path'
import config from '../../config'
import replaceExt = require('replace-ext')

export type FileConstructorOption = {
    sourceFile: string
    content: Content
    ast?: object
    targetFile?: object
}

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
        this.targetFile = option.sourceFile.replace(config.srcDir, config.distDir) // Default value
        this.content = option.content
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

    saveTo (path: string) {
        if (!path) {
            throw new Error('Invalid path')
        }
    }

    updateExt (ext: string) {
        this.targetFile = replaceExt(this.targetFile, ext)
    }
}

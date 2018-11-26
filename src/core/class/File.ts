import * as path from 'path'
import * as fs from 'fs-extra'
import config from '../../config'
import * as t from '@babel/types'
import * as PostCSS from 'postcss'
import {
    Content,
    FileConstructorOption
} from '../../../types/types'

const replaceExt = require('replace-ext')

export default class File {
    public sourceFile: string
    public content: Content
    public targetFile: string
    public ast?: t.Node | PostCSS.Result
    public sourceMap?: Content
    public isInSrcDir?: boolean

    constructor (option: FileConstructorOption) {
        const isInSrcDirTest = new RegExp(`^${config.srcDir}`)

        if (!option.sourceFile) throw new Error('Invalid value: FileConstructorOption.sourceFile')
        if (!option.content) throw new Error('Invalid value: FileConstructorOption.content')

        this.sourceFile = option.sourceFile
        this.targetFile = option.targetFile || option.sourceFile.replace(config.srcDir, config.distDir) // Default value
        this.content = option.content
        this.sourceMap = option.sourceMap
        this.isInSrcDir = isInSrcDirTest.test(this.sourceFile)
    }

    get dirname () {
        return path.dirname(this.targetFile)
    }

    get basename () {
        return path.basename(this.targetFile)
    }

    get extname () {
        return path.extname(this.targetFile)
    }

    async saveTo (path: string): Promise<void> {
        await fs.ensureFile(path)

        if (!path) {
            throw new Error('Invalid path')
        }
    }

    updateExt (ext: string): void {
        this.targetFile = replaceExt(this.targetFile, ext)
    }

    convertContentToString () {
        if (this.content instanceof Buffer) {
            this.content = this.content.toString()
        }
    }
}

import path from 'path'
import fs from 'fs-extra'
import log from '../util/log'
import { ACTIONS, FILE_TYPES } from '../config/types'
import { copyFile, saveFile } from '../util'
import system from '../config'
import Dependence from './Dependence'

export default class File extends Dependence {
    constructor (src) {
        super()
        const ext = path.extname(src)
        this.ext = ext.replace(/^\./, '')
        this.basename = path.basename(src)
        this.name = this.basename.replace(ext, '')
        this.src = path.resolve(system.cwd, src)
        this.originalContent = ''
        this.compiledContent = ''
        this.dist = src.replace(system.srcDir, system.distDir)
        this.distDir = path.dirname(this.dist)
    }

    unlinkFromDist () {
        fs.unlinkSync(this.dist)
        log.info(ACTIONS.REMOVE, this.dist)
    }

    updateContent () {
        this.originalContent = fs.readFileSync(this.src)
    }

    save () {
        if (!this.src || !this.compiledContent || !this.dist) return
        saveFile(this.dist, this.compiledContent)
    }
}

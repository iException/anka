import path from 'path'
import fs from 'fs-extra'
import log from '../util/log'
import {ACTIONS, FILE_TYPES} from '../config/types'
import { copyFile, saveFile } from '../util'

export default class File {
    constructor ({ sourcePath, ext, type, name }) {
        this.ext = ext
        this.type = type
        this.originalContent = ''
        this.compiledContent = ''
        this.sourcePath = sourcePath
        this.targetPath = sourcePath.replace(path.resolve(process.cwd(), 'src'), path.resolve(process.cwd(), 'dist'))
        this.targetDir = path.dirname(this.targetPath)
        if (type === FILE_TYPES.STYLE) {
            this.targetPath = path.join(this.targetDir, `${name}.wxss`)
        }
    }

    unlinkFromDist () {
        fs.unlinkSync(this.targetPath)
        log.info(ACTIONS.REMOVE, this.targetPath)
    }

    updateContent () {
        this.originalContent = fs.readFileSync(this.sourcePath)
    }

    save () {
        if (!this.sourcePath || !this.compiledContent || !this.targetPath) return
        saveFile(this.targetPath, this.compiledContent)
    }

    /**
     * 未知类型文件直接使用拷贝
     */
    compile () {
        log.info(ACTIONS.COPY, this.sourcePath)
        this.copy()
    }

    copy () {
        copyFile(this.sourcePath, this.targetPath)
    }
}

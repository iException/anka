import path from 'path'
import fs from 'fs-extra'
import log from '../util/log'
import { ACTIONS } from '../config/types'
import { copyFile, saveFile } from '../util'

export default class File {
    constructor ({ sourcePath = '', ext = '', type = '' }) {
        this.ext = ext
        this.type = type
        this.sourcePath = sourcePath
        this.targetPath = sourcePath.replace(path.resolve(process.cwd(), 'src'), path.resolve(process.cwd(), 'dist'))
        this.targetDir = path.dirname(this.targetPath)
    }

    unlinkFromDist () {
        fs.unlinkSync(this.targetPath)
        log.info(ACTIONS.REMOVE, this.targetPath)
    }

    updateContent () {
        this.$content = fs.readFileSync(this.sourcePath)
    }

    save () {
        if (!this.sourcePath || !this.content || !this.targetPath) return
        saveFile(this.targetPath, this.content)
    }

    /**
     * 未知类型文件直接使用拷贝
     */
    compile () {
        log.info('拷贝', this.sourcePath )
        copyFile(this.sourcePath, this.targetPath)
    }
}

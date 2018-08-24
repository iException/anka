import path from 'path'
import File from './File'
import log from '../util/log'
import loader from '../loader/index'
import {ACTIONS, FILE_TYPES} from '../config/types'
import { copyFile } from '../util'

export default class StyleFile extends File {
    constructor (src) {
        super(src)
        this.type = FILE_TYPES.STYLE
        this.dist = path.join(this.distDir, `${this.name}.wxss`)
    }

    async compile () {
        const parser = loader[this.ext]
        if (parser) {
            try {
                this.updateContent()
                this.compiledContent = await loader[this.ext]({
                    file: this.src,
                    content: this.originalContent.toString('utf8')
                })
                this.save()
                log.info(ACTIONS.COMPILE, this.src)
            } catch (err) {
                log.error(ACTIONS.COMPILE, this.src, err.formatted || err)
            }
        } else {
            copyFile(this.src, this.dist)
            log.info(ACTIONS.COPY, this.src)
        }
    }
}

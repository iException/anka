import File from './File'
import log from '../util/log'
import loader from '../loader/index'
import { ACTIONS } from '../config/types'
import {copyFile} from '../util'

export default class StyleFile extends File {
    async compile () {
        this.updateContent()
        const parser = loader[this.ext]
        if (parser) {
            try {
                this.compiledContent = await loader[this.ext]({
                    file: this.sourcePath,
                    content: this.originalContent.toString('utf8')
                })
            } catch (err) {
                log.error(ACTIONS.COMPILE, this.sourcePath, err.formatted || err)
            }
            this.save()
            log.info(ACTIONS.COMPILE, this.sourcePath)
        } else {
            this.copy()
            log.info(ACTIONS.COPY, this.sourcePath)
        }
    }
}

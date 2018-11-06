import File from './File'
import log from '../util/log'
import {ACTIONS, FILE_TYPES} from '../config/types'
import {copyFile} from '../util'

export default class UnknownFile extends File {
    constructor (src) {
        super(src)
        this.type = FILE_TYPES.UNKNOWN
    }

    /**
     * 未知类型文件直接使用拷贝
     */
    compile () {
        log.info(ACTIONS.COPY, this.src)
        copyFile(this.src, this.dist)
    }
}

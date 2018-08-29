import File from './File'
import {extractFileConfig} from '../util'
import {FILE_TYPES} from '../config/types'
import ScriptFile from './ScriptFile'
import StyleFile from './StyleFile'
import UnknownFile from './UnknownFile'

export default class LocalDependence {
    constructor (src) {
        const fileConfig = extractFileConfig(src)

        switch (fileConfig.type) {
            case FILE_TYPES.SCRIPT:
                this.file = new ScriptFile(src)
                break
            case FILE_TYPES.STYLE:
                this.file = new StyleFile(src)
                break
            default:
                this.file = new UnknownFile(src)
                break
        }
    }

    updateContent () {
        this.file.updateContent()
    }

    async compile () {
        await this.file.compile()
    }

    unlinkFromDist () {
        this.file.unlinkFromDist()
    }

    get type () {
        return this.file.type
    }

    get src () {
        return this.file.src
    }

    get dist () {
        return this.file.dist
    }
}

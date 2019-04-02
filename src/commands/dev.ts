import config  from '../config'
import { logger } from '../utils'
import { Command, Compiler } from '../core'
import messager from '../utils/messager'
import { CommandOpts } from '../../types'

export default class DevCommand extends Command {
    constructor () {
        super(
            'dev [pages...]',
            'Development mode'
        )

        this.setExamples(
            '$ anka dev',
            '$ anka dev index',
            '$ anka dev /pages/log/log /pages/user/user'
        )

        this.$compiler = new Compiler()
    }

    async action (pages?: Array<string>, options?: CommandOpts.DevCommandOpts) {
        this.$compiler.config.ankaConfig.devMode = true

        this.initCompiler()
        await this.$compiler.clean()
        await this.$compiler.launch()
        await this.$compiler.watchFiles()
    }
}

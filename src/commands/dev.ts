import { logger } from '../utils'
import { Command, Compiler } from '../core'

export type DevCommandOpts = Object & {}

export default class DevCommand extends Command {
    constructor () {
        super(
            'dev [pages...]',
            'Development Mode'
        )

        this.setExamples(
            '$ anka dev',
            '$ anka dev index',
            '$ anka dev /pages/log/log /pages/user/user'
        )

        this.$compiler = new Compiler()
    }

    async action (pages?: Array<string>, options?: DevCommandOpts) {
        const startupTime = Date.now()
        this.initCompiler()
        await this.$compiler.launch()
        await this.$compiler.watchFiles()
        logger.success(`Startup: ${Date.now() - startupTime}ms`, `Anka is waiting for changes...`)
    }
}

import { logger } from '../utils'
import { Command, Compiler } from '../core'

export type DevCommandOpts = Object & {}

export default class DevCommand extends Command {
    constructor () {
        super(
            'prod',
            'Production Mode'
        )

        this.setExamples(
            '$ anka prod'
        )

        this.$compiler = new Compiler()
    }

    async action (pages?: Array<string>, options?: DevCommandOpts) {
        const startupTime = Date.now()
        this.initCompiler()
        await this.$compiler.launch()
        logger.success(`Done: ${Date.now() - startupTime}ms`, 'Have a nice day 🎉 !')
    }
}

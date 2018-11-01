import { Command, Compiler } from '../core'

export type DevCommandOpts = Object & {}

export default class DevCommand extends Command {
    constructor () {
        super('dev <pages...>')

        this.setExamples(
            '$ anka dev',
            '$ anka dev index',
            '$ anka dev /pages/log/log /pages/user/user'
        )

        this.$compiler = new Compiler()
    }

    action (pages?: Array<string>, options?: DevCommandOpts) {
        this.initCompiler()
        this.$compiler.launch()
    }
}

import { Command, Anka } from '../core'

export type DevCommandOpts = Object & {}

export default class DevCommand extends Command {
    constructor () {
        super('dev <pages...>')

        this.setExamples(
            '$ anka dev',
            '$ anka dev index',
            '$ anka dev /pages/log/log /pages/user/user'
        )
    }

    action (pages: Array<string>, options: DevCommandOpts) {
        this.initCompiler()
        this.$anka.emit('after-init', )
    }
}

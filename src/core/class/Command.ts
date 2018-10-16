import Anka from "./Anka";

export default abstract class Command {
    public command: string
    public options: Array<string>
    public alias: string
    public usage: string
    public description: string
    public examples: Array<string>
    public $anka: Anka

    constructor (command: string) {
        this.command = command
        this.options = []
        this.alias = ''
        this.usage = ''
        this.description = ''
        this.examples = []
        this.$anka = null
    }

    abstract action (param: string | Array<string>, options: Object): Promise<any> | void

    /**
     * Initialize anka core compiler
     */
    protected initCompiler (): void {
        this.$anka = new Anka()
    }

    protected setUsage (usage: string): void {
        this.usage = usage
    }

    protected setOptions (...options: Array<string>): void {
        this.options = this.options.concat(options)
    }

    protected setExamples (...example: Array<string>): void {
        this.examples = this.examples.concat(example)
    }
}

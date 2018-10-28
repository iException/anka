import Compiler from './Compiler'

export default abstract class Command {
    public command: string
    public options: Array<string>
    public alias: string
    public usage: string
    public description: string
    public examples: Array<string>
    public $compiler: Compiler

    constructor (command: string) {
        this.command = command
        this.options = []
        this.alias = ''
        this.usage = ''
        this.description = ''
        this.examples = []
        this.$compiler = null
    }

    abstract action (param: string | Array<string>, options: Object): Promise<any> | void

    /**
     * Initialize anka core compiler
     */
    protected initCompiler (): void {
        this.$compiler = new Compiler()
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

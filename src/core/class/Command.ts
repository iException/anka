import Compiler from './Compiler'

export default abstract class Command {
    public command: string
    public options: Array<unknown>
    public alias: string
    public usage: string
    public description: string
    public examples: Array<string>
    public $compiler: Compiler
    public on: {
        [key: string]: (...arg: any[]) => void
    }

    constructor (command: string, desc?: string) {
        this.command = command
        this.options = []
        this.alias = ''
        this.usage = ''
        this.description = desc
        this.examples = []
        this.on = {}
    }

    abstract action (param: string | Array<string>, options: Object, ...other: any[]): Promise<any> | void

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

    public printTitle (...arg: Array<any>) {
        console.log('\r\n ', ...arg, '\r\n')
    }

    public printContent (...arg: Array<any>) {
        console.log('   ', ...arg)
    }
}

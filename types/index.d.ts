

declare type MatcherOptions = {
    match: RegExp,
    parsers: Array<ParserOptions>
}

declare type ParserOptions = {
    parser: Parser,
    options?: object
}

declare type PluginOptions = {
    plugin: Plugin,
    options?: object
}

declare type PluginsConfigration = Array<PluginOptions>

declare type ParsersConfigration = Array<MatcherOptions>

declare type Content = string | Buffer

declare type Parser = (this: ParserInjection, file: File, cb: Function) => void
declare type Plugin = (this: PluginInjection) => void
declare type PluginHandler = (compilation: Compilation, cb?: Function) => void

declare class Compiler {
    readonly config: object
    public static compilationId: number
    public static compilationPool: Map<string, Compilation>

    plugins: {
        [eventName: string]: Array<Plugin>
    }
    parsers: {
        test: RegExp,
        parsers: Array<Parser>
    }

    on (event: string, handler: PluginHandler): void

    emit (event: string, compilation: Compilation): Promise<any>

    launch (): Promise<any>

    generateCompilation (file: File): Compilation

    initParsers (): void

    initPlugins (): void
}

declare class Compilation {
    readonly config: object
    readonly compiler: Compiler
    id: number        // Unique，for each Compilation
    file: File
    sourceFile: string
    // targetFile: string
    // ast: Object | undefined
    resourceType: RESOURCE_TYPE
    parsers: Array<Parser>

    // Status，
    destroyed: boolean

    run (): Promise<void>

    loadFile (): Promise<void>

    invokeParsers (): Promise<void>

    compile (): Promise<void>

    /**
     * Register on Compiler and destroy the previous one if conflict arises.
     */
    register (): void

    /**
     * Unregister themselves from Compiler.
     */
    destroy (): void
}

declare class File {
    public sourceFile: string
    public content: Content
    public targetFile: string
    public ast?: object
    public sourceMap?: Content
    public dirname: string
    public basename: string
    public extname: string

    new (option: FileConstructorOption): File

    saveTo (path: string): void

    updateExt (ext: string): void
}

declare type FileConstructorOption = {
    sourceFile: string
    content: Content
    ast?: acorn.Node
    targetFile?: string
    sourceMap?: string
}

declare class Injection {
    getAnkaConfig (): object
    getSystemConfig (): object
    getProjectConfig (): object
}

declare class ParserInjection extends Injection {
    /**
     * Return parser options
     */
    getOptions (): object
}

declare class PluginInjection extends Injection {
    /**
     * Return plugin options
     */
    getOptions (): object

    /**
     * Register processing function in Compilation life cycle hooks
     * @param event
     * @param handler
     */
    on (event: string, handler: PluginHandler): void
}

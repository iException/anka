declare type CompilerConfig = {
    cwd: string
    srcDir: string
    distDir: string
    ankaModules: string
    distNodeModules: string
    sourceNodeModules: string
    defaultScaffold: string
    ankaConfig: AnkaConfig
    projectConfig: ProjectConfig
}

declare type AnkaConfig = {
     /**
     * The path where WeChat miniprogram source files exist.
     * @default './src'
     */
    sourceDir: string

    /**
     * The path where WeChat miniprogram compiled files exist.
     * @default './dist'
     */
    outputDir: string

    /**
     * The path where WeChat miniprogram pages exist.
     * @default './src/pages'
     */
    pages: string

    /**
     * The path where WeChat miniprogram components exist.
     * @default './src/components'
     */
    components: string

    /**
     * Whether to output compile information.
     * @default false
     */
    silent: boolean

    /**
     * Anka development mode.
     * @default false
     */
    devMode: boolean

    /**
     * Register file parser.
     */
    parsers: ParsersConfigration

    /**
     * Whether to output debug information.
     * @default false
     */
    debug: boolean

    /**
     * Register plugin.
     */
    plugins: PluginsConfigration
}

declare type ProjectConfig = object

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

declare type PluginsConfigration = PluginOptions[]

declare type ParsersConfigration = MatcherOptions[]

declare type Content = string | Buffer

declare type Parser = (this: ParserInjection, file: File, compilation: Compilation, cb: Function) => void
declare type Plugin = (this: PluginInjection) => void
declare type PluginHandler = (compilation: Compilation, cb?: Function) => void

declare class Compiler {
    readonly config: object
    public static compilationId: number
    public static compilationPool: Map<string, Compilation>

    plugins: {
        [eventName: string]: Array<PluginHandler>
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

    generatePluginInjection (options: PluginOptions['options']): PluginInjection

    generateParserInjection (options: ParserOptions['options']): ParserOptions
}

declare class Compilation {
    config: object
    readonly compiler: Compiler
    id: number        // Unique，for each Compilation
    file: File
    sourceFile: string
    resourceType: RESOURCE_TYPE
    parsers: Array<Parser>

    // Status，
    destroyed: boolean

    new (file: File | string, conf: object, compiler: Compiler): Compilation

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
    new (compiler: Compiler, options: ParserOptions['options']): ParserInjection

    /**
     * Return parser options
     */
    getOptions (): object
}

declare class PluginInjection extends Injection {
    new (compiler: Compiler, options: PluginOptions['options']): Compiler

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

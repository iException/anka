import * as t from '@babel/types'
import utils from './utils'

type CompilerConfig = {
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

export type AnkaConfig = {
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
     * Template for creating page and component.
     */
    template: {
        page: string
        component: string
    }

    /**
     * The path where WeChat miniprogram subpackages exist.
     * @default './src/subPackages'
     */
    subPackages: string

    /**
     * Whether to output compile information.
     * @default false
     */
    quiet: boolean

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

    /**
     * Files that will be ignored in compilation.
     */
    ignored: IgnoredConfigration
}

export type ProjectConfig = {
    [key: string]: any
}

export type Matcher = {
    match: RegExp,
    parsers: Array<Parser>
}

export type MatcherOptions = {
    match: RegExp,
    parsers: Array<ParserOptions>
}

export type ParserOptions = {
    parser: Parser,
    options?: object
}

export type PluginOptions = {
    plugin: Plugin,
    options?: object
}

export type IgnoredConfigration = string[]

export type PluginsConfigration = PluginOptions[]

export type ParsersConfigration = MatcherOptions[]

export type Content = string | Buffer

export type Parser = (this: ParserInjection, file: File, compilation: Compilation, cb: Function) => void
export type Plugin = (this: PluginInjection) => void
export type PluginHandler = (compilation: Compilation, cb?: Function) => void

export class Compiler {
    readonly config: CompilerConfig
    public static compilationId: number
    public static compilationPool: Map<string, Compilation>

    plugins: {
        [eventName: string]: Array<PluginHandler>
    }
    parsers: Array<{
        match: RegExp,
        parsers: Array<Parser>
    }>

    on (event: string, handler: PluginHandler): void

    emit (event: string, compilation: Compilation): Promise<any>

    /**
     * Clean dist directory.
     */
    clean (): Promise<void>

    launch (): Promise<any>

    watchFiles (): Promise<any>

    generateCompilation (file: File): Compilation

    initParsers (): void

    initPlugins (): void

    generatePluginInjection (options: PluginOptions['options']): PluginInjection

    generateParserInjection (options: ParserOptions['options']): ParserOptions
}

export class Compilation {
    config: object
    readonly compiler: Compiler
    id: number        // Unique，for each Compilation
    file: File
    sourceFile: string
    destroyed: boolean

    constructor (file: File | string, conf: object, compiler: Compiler)

    run (): Promise<void>

    loadFile (): Promise<void>

    invokeParsers (): Promise<void>

    compile (): Promise<void>

    /**
     * Register on Compiler and destroy the previous one if conflict arises.
     */
    enroll (): void

    /**
     * Unregister themselves from Compiler.
     */
    destroy (): void
}

export class File {
    public sourceFile: string
    public content: Content
    public targetFile: string
    public ast?: t.Node
    public sourceMap?: Content
    public dirname: string
    public basename: string
    public extname: string
    public isInSrcDir?: boolean

    constructor (option: FileConstructorOption)

    saveTo (path: string): Promise<void>

    updateExt (ext: string): void
}

export type FileConstructorOption = {
    sourceFile: string
    content: Content
    ast?: t.File
    targetFile?: string
    sourceMap?: string
}

export class Injection {
    getUtils(): Utils
    getCompiler (): Compiler
    getAnkaConfig (): AnkaConfig
    getSystemConfig (): CompilerConfig
    getProjectConfig (): ProjectConfig
}

export class ParserInjection extends Injection {
    new (compiler: Compiler, options: ParserOptions['options']): ParserInjection

    /**
     * Return parser options
     */
    getOptions (): object
}

export class PluginInjection extends Injection {
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

export type Utils = utils

// export  utils = Utils

/**
 * A compilation task
 */

export default class Compilation {
    sourceFile: string
    targetFile: string
    config: any
    loaders: Array<Loader>
    content: Content
    sourceMap: string | undefined
    ast: Object | undefined
}

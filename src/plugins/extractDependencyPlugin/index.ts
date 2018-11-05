import {
    File,
    Compiler
} from '../../core'
import * as path from 'path'
import * as acorn from 'acorn'
import * as utils from '../../utils'
import * as escodegen from 'escodegen'
import * as acornWalker from 'acorn-walk'

const dependencyPool = new Map<string, string>()

export default <Plugin> function (this: PluginInjection) {
    const compiler = this.getCompiler()
    const config = this.getSystemConfig()
    const testNodeModules = new RegExp(`^${config.sourceNodeModules}`)

    this.on('before-compile', function (compilation: Compilation, cb: Function) {
        const file = compilation.file
        const localDependencyPool = new Map<string, string>()

        // Only resolve js file.
        if (file.extname === '.js') {
            if (file.ast === void (0)) {
                file.ast = acorn.parse(
                    file.content instanceof Buffer ? file.content.toString() : file.content,
                    {
                        sourceType: 'module'
                    }
                )
            }
            acornWalker.simple (file.ast, {
                ImportDeclaration (node: any) {
                    const source = node.source

                    if (
                        source &&
                        source.value &&
                        source.type === 'Literal' &&
                        typeof source.value === 'string'
                    ) {
                        resolve(source, file.sourceFile, file.targetFile, localDependencyPool)
                    }
                },
                CallExpression (node: any) {
                    const callee = node.callee
                    const args = node.arguments

                    if (
                        args &&
                        callee &&
                        args[0] &&
                        args[0].value &&
                        callee.name === 'require' &&
                        args[0].type === 'Literal' &&
                        typeof args[0].value === 'string'
                    ) {
                        resolve(args[0], file.sourceFile, file.targetFile, localDependencyPool)
                    }
                }
            })
            file.content = escodegen.generate(file.ast)

            const dependencyList = Array.from(localDependencyPool.keys()).filter(dependency => !dependencyPool.has(dependency))

            Promise.all(dependencyList.map(dependency => traverseNpmDependency(dependency))).then(() => {
                cb()
            }).catch(err => {
                cb()
                utils.logger.error(file.sourceFile, err.message, err)
            })
        } else {
            cb()
        }
    } as PluginHandler)

    function resolve (node: any, sourceFile: string, targetFile: string, localDependencyPool: Map<string, string>) {
        const sourceBaseName = path.dirname(sourceFile)
        const targetBaseName = path.dirname(targetFile)
        const dependency = utils.resolveModule(node.value, {
            paths: [sourceBaseName]
        })

        if (testNodeModules.test(dependency)) {
            const distPath = dependency.replace(config.sourceNodeModules, config.distNodeModules)

            node.value = path.relative(targetBaseName, distPath)

            if (localDependencyPool.has(dependency)) return
            localDependencyPool.set(dependency, dependency)
        }
    }

    async function traverseNpmDependency (dependency: string) {
        dependencyPool.set(dependency, dependency)
        const file = await utils.createFile(dependency)

        file.targetFile = file.sourceFile.replace(config.sourceNodeModules, config.distNodeModules)
        await compiler.generateCompilation(file).run()
    }

}

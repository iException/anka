import {
    File,
    Compiler
} from '../../core'
import * as path from 'path'
import * as acorn from 'acorn'
import * as utils from '../../utils'
import * as escodegen from 'escodegen'
import * as acornWalker from 'acorn-walk'

const dependencyPool = new Map<string, string | undefined>()

export default <Plugin> function (this: PluginInjection) {
    const compiler = this.getCompiler()
    const config = this.getSystemConfig()
    const testNodeModules = new RegExp(`^${config.sourceNodeModules}`)

    this.on('before-compile', function (compilation: Compilation, cb: Function) {
        const file = compilation.file

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
                        resolve(source, file.sourceFile, file.targetFile)
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
                        resolve(args[0], file.sourceFile, file.targetFile)
                    }
                }
            })
            file.content = escodegen.generate(file.ast)
        }

        cb()
        // const newCompthis.generateCompilation()
    } as PluginHandler)

    function resolve (node: any, sourceFile: string, targetFile: string) {
        const sourceBaseName = path.dirname(sourceFile)
        const targetBaseName = path.dirname(targetFile)

        if (utils.isNpmDependency(node.value)) {
            const dependency = utils.resolveModule(node.value, {
                paths: [sourceBaseName]
            })

            if (!dependency) {
                console.log(node.value, 'is not exist', sourceFile)
                return
            }
            const distPath = dependency.replace(config.sourceNodeModules, config.distNodeModules)

            node.value = path.relative(targetBaseName, distPath)
            if (dependencyPool.has(dependency)) return
            traverseNpmDependency(dependency)
        } else {
            // If the file exists in node_modules
            if (testNodeModules.test(sourceFile)) {
                const dependency = utils.resolveModule(node.value, {
                    paths: [sourceBaseName]
                })
                const distPath = dependency.replace(config.sourceNodeModules, config.distNodeModules)
                node.value = path.relative(targetBaseName, distPath)

                if (dependencyPool.has(dependency)) return
                traverseNpmDependency(dependency)
            }
        }
    }

    function traverseNpmDependency (dependency: string) {
        if (dependencyPool.has(dependency)) return
        dependencyPool.set(dependency, dependency)

        const file = utils.createFileSync(dependency)

        file.targetFile = file.sourceFile.replace(config.sourceNodeModules, config.distNodeModules)
        compiler.generateCompilation(file).run().then(() => {
            // logger.info('Resolve', dependency)
        }).catch(err => {
            utils.logger.error(dependency, err.message, err)
        })
    }

}

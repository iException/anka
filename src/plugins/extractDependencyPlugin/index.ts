import * as path from 'path'
import * as t from '@babel/types'
import * as utils from '../../utils'
import * as babel from '@babel/core'
import traverse from '@babel/traverse'

import {
    Plugin,
    Compilation,
    PluginHandler,
    PluginInjection
} from '../../../types/types'

const dependencyPool = new Map<string, string>()
const resovleModuleName = require('require-package-name')

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
                file.ast = <t.File>babel.parse(
                    file.content instanceof Buffer ? file.content.toString() : file.content,
                    {
                        babelrc: false,
                        sourceType: 'module'
                    }
                )
            }

            traverse(file.ast, {
                enter (path) {
                    if (path.isImportDeclaration()) {
                        const node = path.node
                        const source = node.source

                        if (
                            source &&
                            source.value &&
                            typeof source.value === 'string'
                        ) {
                            resolve(source, file.sourceFile, file.targetFile, localDependencyPool)
                        }
                    }

                    if (path.isCallExpression()) {
                        const node = path.node
                        const callee = <t.Identifier>node.callee
                        const args = <t.StringLiteral[]>node.arguments

                        if (
                            args &&
                            callee &&
                            args[0] &&
                            args[0].value &&
                            callee.name === 'require' &&
                            typeof args[0].value === 'string'
                        ) {
                            resolve(args[0], file.sourceFile, file.targetFile, localDependencyPool)
                        }
                    }
                }
            })

            file.content = babel.transformFromAstSync(file.ast).code

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
        const moduleName = resovleModuleName(node.value)


        if (utils.isNpmDependency(moduleName) || testNodeModules.test(sourceFile)) {
            const dependency = utils.resolveModule(node.value, {
                paths: [sourceBaseName]
            })

            if (!dependency) return

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

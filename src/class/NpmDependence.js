import path from 'path'
import fs from 'fs-extra'
import babel from 'babel-core'
import traverse from 'babel-traverse'
import * as editor from '../util/fileEditor'
import ankaConfig from '../config/ankaConfig'
import {copyFile, extractFileConfig, saveFile} from '../util'

const cwd = process.cwd()

export class NpmDependence {
    constructor (dependence) {
        // 该 npm 包的内部所有依赖文件
        this.localDependencies = {}
        this.name = dependence
        this.sourcePath = path.resolve(cwd, ankaConfig.sourceNodeModules, dependence)
        this.targetPath = path.resolve(cwd, ankaConfig.distNodeModules, dependence)
        this.pkgInfo = Object.assign({
            main: 'index.js'
        }, require(path.join(this.sourcePath, './package.json')))
    }

    /**
     * 提取 npm 包内部的所有依赖
     * @param {string} filePath 依赖文件的绝对路径
     */
    extractLocalDependencies (filePath) {
        if (this.localDependencies[filePath]) return
        const fileConfig = extractFileConfig(filePath)
        const { ast } = babel.transformFileSync(filePath, {
            ast: true,
            babelrc: false
        })
        traverse(ast, {
            enter: (astNode) => {
                const node = astNode.node
                if (astNode.isImportDeclaration()) {
                    const dependence = node.source.value

                    if (this.isLocalDependence(dependence)) {
                        this.extractLocalDependencies(this.resolveModule(dependence, filePath))
                    } else {
                        const data = new NpmDependence(dependence)
                        node.source.value = path.join(path.relative(path.dirname(filePath), data.sourcePath), data.pkgInfo.main)
                    }
                } else if (astNode.isCallExpression() &&
                    node.callee.name === 'require' &&
                    node.arguments[0] &&
                    node.arguments[0].value
                ) {
                    const dependence = node.arguments[0].value
                    if (this.isLocalDependence(dependence)) {
                        this.extractLocalDependencies(this.resolveModule(dependence, filePath))
                    } else {
                        const data = new NpmDependence(dependence)
                        node.arguments[0].value = path.join(path.relative(path.dirname(filePath), data.sourcePath), data.pkgInfo.main)
                    }
                }
            }
        })
        this.localDependencies[filePath] = {
            ast,
            filePath,
            fileConfig
        }
    }

    /**
     * 将该 npm 模块从 node_modules 移到 ankaConfig.distNodeModules
     */
    move () {
        this.extractLocalDependencies(this.resolveModule(this.name))
        Object.values(this.localDependencies).map(dependence => {
            const filePath = dependence.filePath
            const targetPath = filePath.replace(this.sourcePath, this.targetPath)
            const { code } = babel.transformFromAst(dependence.ast)
            saveFile(targetPath, code)
        })
    }

    resolveModule (dependence = '', relativePath = this.sourcePath) {
        if (path.parse(relativePath).ext) {
            relativePath = path.dirname(relativePath)
        }
        return require.resolve(dependence, {
            paths: [relativePath]
        })
    }

    isLocalDependence (dependence) {
        return /^[/|.|\\]/.test(dependence)
    }
}

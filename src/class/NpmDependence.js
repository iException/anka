import path from 'path'
import fs from 'fs-extra'
import log from '../util/log'
import babel from 'babel-core'
import system from '../config'
import { saveFile } from '../util'
import traverse from 'babel-traverse'
import Dependence from './Dependence'
import { ACTIONS } from '../config/types'
import { npmDependenceCache } from '../util/cache'

export class NpmDependence extends Dependence {
    constructor (dependence) {
        super()
        this.localDependencies = {}
        this.npmDependencies = {}
        this.name = dependence
        this.src = path.join(system.sourceNodeModules, dependence)
        this.dist = path.join(system.distNodeModules, dependence)
        this.distDir = path.dirname(this.dist)

        const pkgPath = path.join(this.src, 'package.json')

        if (fs.existsSync(pkgPath)) {
            this.pkgInfo = Object.assign({
                main: 'index.js'
            }, require(pkgPath))
        }

        // Maybe there is not pkgInfo here
        this.main = this.resolveLocalDependence(this.name)
    }

    /**
     * 提取 npm 包内部的所有依赖
     * @param {string} filePath 依赖文件的绝对路径
     */
    traverse (filePath) {
        if (this.localDependencies[filePath]) return
        const { ast } = babel.transformFileSync(filePath, {
            ast: true,
            babelrc: false
            // ...system.babelConfig.options
        })
        traverse(ast, {
            enter: astNode => {
                const node = astNode.node
                if (astNode.isImportDeclaration()) {
                    const dependence = node.source.value
                    if (this.isLocalDependence(dependence)) {
                        this.traverse(this.resolveLocalDependence(dependence, filePath))
                    } else if (this.isNpmDependence(dependence)) {
                        const npmDependence = new NpmDependence(dependence)

                        node.source.value = this.resolveNpmDependence(npmDependence, filePath)
                    }
                } else if (astNode.isCallExpression() &&
                    node.callee.name === 'require' &&
                    node.arguments[0] &&
                    node.arguments[0].value
                ) {
                    const dependence = node.arguments[0].value
                    if (this.isLocalDependence(dependence)) {
                        this.traverse(this.resolveLocalDependence(dependence, filePath))
                    } else if (this.isNpmDependence(dependence)) {
                        const npmDependence = new NpmDependence(dependence)
                        node.arguments[0].value = this.resolveNpmDependence(npmDependence, filePath)
                    }
                }
            }
        })
        this.localDependencies[filePath] = {
            ast,
            filePath
        }
    }

    /**
     * 将该 npm 模块从 node_modules 移到 system.distNodeModules
     */
    compile () {
        this.traverse(this.main)
        Object.values(this.localDependencies).map(localDependence => {
            const filePath = localDependence.filePath
            const dist = filePath.replace(system.sourceNodeModules, system.distNodeModules)
            const { code } = babel.transformFromAst(localDependence.ast, null, {
                compact: !system.devMode
            })
            saveFile(dist, code)
        })
        this.updateNpmDependenceCache()
        log.info(ACTIONS.COMPILE, this.src)
    }

    /**
     * 根据依赖名或者相对路径获取依赖的绝对路径，eg: ./index => /A/B/index.js
     * @param localDependence
     * @param filePath
     * @returns {string}
     */
    resolveLocalDependence (localDependence = '', filePath = this.src) {
        if (path.parse(filePath).ext) {
            filePath = path.dirname(filePath)
        }
        return require.resolve(localDependence, {
            paths: [filePath]
        })
    }

    /**
     * 在 npm_modules 目录下均使用相对路径
     * @param {*} npmDependence
     * @param {*} filePath npm 模块【文件】路径
     */
    resolveNpmDependence (npmDependence, filePath = this.main) {
        const dist = path.relative(path.dirname(filePath), npmDependence.src)
        this.npmDependencies[npmDependence.name] = npmDependence
        return npmDependence.pkgInfo ? path.join(dist, npmDependence.pkgInfo.main) : dist
    }

    updateNpmDependenceCache () {
        Object.values(this.npmDependencies).forEach(npmDependence => {
            if (!npmDependenceCache.find(npmDependence.name)) {
                npmDependenceCache.set(npmDependence.name, npmDependence)
                npmDependence.compile()
            }
        })
    }
}

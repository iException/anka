import path from 'path'
import fs from 'fs-extra'
import File from './File'
import babel from 'babel-core'
import system from '../config'
import traverse from 'babel-traverse'
import ankaConfig from '../config/ankaConfig'
import { copyFile, extractFileConfig, saveFile } from '../util'
import Dependence from './Dependence'
import {npmDependenceCache} from '../util/cache'
import log from '../util/log'
import {ACTIONS} from '../config/types'

const cwd = system.cwd

export class NpmDependence extends Dependence {
    constructor (dependence) {
        super()
        this.localDependencies = {}
        this.npmDependencies = {}
        this.name = dependence
        this.src = path.resolve(cwd, system.sourceNodeModules, dependence)
        this.dist = path.resolve(cwd, system.distNodeModules, dependence)
        this.pkgInfo = Object.assign({
            main: 'index.js'
        }, require(path.join(this.src, './package.json')))
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
            const dist = filePath.replace(this.src, this.dist)
            const { code } = babel.transformFromAst(localDependence.ast)
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

    resolveNpmDependence (npmDependence, filePath = this.main) {
        this.npmDependencies[npmDependence.name] = npmDependence
        return path.join(path.relative(path.dirname(filePath), npmDependence.src), npmDependence.pkgInfo.main)
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

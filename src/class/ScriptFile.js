import fs from 'fs'
import path from 'path'
import File from './File'
import log from '../util/log'
import babel from 'babel-core'
import system from '../config'
import traverse from 'babel-traverse'
import { ACTIONS } from '../config/types'
import genDependenceData from '../util/genDependenceData'
import { npmFilesCache, localFilesCache } from '../util/cache'

export default class ScriptFile extends File {
    /**
     * 将 node_modules 中存在的包加入依赖
     * @param {*} dependence
     */
    isThirdPartyModule (dependence) {
        if (/^(@|[A-Za-z0-1])/.test(dependence)) {
            const dependencePath = path.resolve(process.cwd(), system.sourceNodeModules, dependence)
            if (fs.existsSync(dependencePath)) {
                return true
            }
        }
    }

    compile () {
        this.updateContent()
        const { ast } = babel.transform(this.originalContent, {
            ast: true,
            babelrc: false
        })
        const _this = this

        traverse(ast, {
            enter (astNode) {
                const node = astNode.node
                if (astNode.isImportDeclaration()) {
                    const dependence = node.source.value
                    if (_this.isThirdPartyModule(dependence)) {
                        const data = genDependenceData(dependence)
                        npmFilesCache.set(dependence, data)
                        node.source.value = path.join(path.relative(_this.targetDir, data.targetPath), data.pkgInfo.main)
                    }
                } else if (astNode.isCallExpression() && node.callee.name === 'require' && node.arguments[0] && node.arguments[0].value) {
                    const dependence = node.arguments[0].value
                    if (_this.isThirdPartyModule(dependence)) {
                        const data = genDependenceData(dependence)
                        npmFilesCache.set(dependence, data)
                        node.arguments[0].value = path.join(path.relative(_this.targetDir, data.targetPath), data.pkgInfo.main)
                    }
                }
            }
        })

        this.$ast = ast
        this.compiledContent = babel.transformFromAst(ast).code
        this.save()
        log.info(ACTIONS.COMPILE, this.sourcePath)
    }
}

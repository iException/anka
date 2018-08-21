import fs from 'fs'
import path from 'path'
import File from './File'
import log from '../util/log'
import babel from 'babel-core'
import traverse from 'babel-traverse'
import { ACTIONS } from '../config/types'
import ankaConfig from '../config/ankaConfig'
import genDependenceData from '../util/genDependenceData'
import { npmFilesCache, localFilesCache } from '../util/cache'

export default class ScriptFile extends File {
    constructor (fileConfig) {
        super(fileConfig)
        this.updateContent()
    }

    /**
     * 将 node_modules 中存在的包加入依赖
     * @param {*} dependence
     */
    isThirdPartyModule (dependence) {
        if (/^(@|[A-Za-z0-1])/.test(dependence)) {
            const dependencePath = path.resolve(process.cwd(), ankaConfig.sourceNodeModules, dependence)
            if (fs.existsSync(dependencePath)) {
                return true
            }
        }
    }

    compile () {
        log.info(ACTIONS.COMPILE, this.sourcePath)
        const { ast } = babel.transform(this.$content, {
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

        const { code } = babel.transformFromAst(ast)
        this.$ast = ast
        this.$content = code
        this.save()
    }

    get content () {
        return this.$content
    }
}

import path from 'path'
import ankaConfig from '../config/ankaConfig'
import loader from 'babel-load-config'
import buildConfigChain from 'babel-core/lib/transformation/file/options/build-config-chain'

const cwd = process.cwd()

export default {
    // 开发模式
    cwd,
    devMode: true,
    srcDir: path.resolve(cwd, ankaConfig.sourceDir),
    distDir: path.resolve(cwd, ankaConfig.outputDir),
    distNodeModules: path.resolve(cwd, './dist/npm_modules'),
    sourceNodeModules: path.resolve(cwd, './node_modules'),
    scaffold: 'direct:https://github.com/iException/anka-quickstart',
    babelConfig: loader(cwd, buildConfigChain)
}

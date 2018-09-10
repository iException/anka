import path from 'path'
import loader from 'babel-load-config'
import buildConfigChain from 'babel-core/lib/transformation/file/options/build-config-chain'

const cwd = process.cwd()

export default {
    // 开发模式
    cwd,
    devMode: true,
    srcDir: path.resolve(cwd, 'src'),
    distDir: path.resolve(cwd, 'dist'),
    distNodeModules: './dist/npm_modules',
    sourceNodeModules: './node_modules',
    scaffold: 'github:iException/mini-program-scaffold',
    babelConfig: loader(cwd, buildConfigChain)
}

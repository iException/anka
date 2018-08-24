import path from 'path'

const cwd = process.cwd()

export default {
    // 开发模式
    cwd,
    devMode: true,
    srcDir: path.resolve(cwd, 'src'),
    distDir: path.resolve(cwd, 'dist'),
    distNodeModules: './dist/npm_modules',
    sourceNodeModules: './node_modules',
    scaffold: 'github:iException/mini-program-scaffold'
}

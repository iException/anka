import * as path from 'path'
import ankaConfig from './ankaConfig'

export const cwd = process.cwd()
export const srcDir = path.resolve(cwd, ankaConfig.sourceDir)
export const distDir = path.resolve(cwd, ankaConfig.outputDir)
export const ankaModules = path.resolve(srcDir, 'anka_modules')
export const sourceNodeModules = path.resolve(cwd, './node_modules')
export const distNodeModules = path.resolve(distDir, './npm_modules')
export const defaultScaffold =  'iException/anka-quickstart'

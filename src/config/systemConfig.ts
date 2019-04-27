import * as path from 'path'
import ankaConfig from './ankaConfig'

const normalize = require('normalize-path')

export const cwd = normalize(process.cwd())
export const srcDir = normalize(path.resolve(cwd, ankaConfig.sourceDir))
export const distDir = normalize(path.resolve(cwd, ankaConfig.outputDir))
export const ankaModules = normalize(path.resolve(srcDir, 'anka_modules'))
export const sourceNodeModules = normalize(path.resolve(cwd, 'node_modules'))
export const distNodeModules = normalize(path.resolve(distDir, 'npm_modules'))
export const defaultScaffold =  'iException/anka-quickstart'

import fs from 'fs-extra'
import path from 'path'
import system from '../config'
import requireModule from '../util/resolveModule'

export default class Dependence {
    isNpmDependence (dependence) {
        if (/^(@|[A-Za-z])/.test(dependence)) {
            const dependencePath = path.resolve(system.cwd, system.sourceNodeModules, dependence)
            if (fs.existsSync(dependencePath) || fs.existsSync(requireModule(dependencePath))) {
                return true
            }
        }
    }

    isLocalDependence (dependence) {
        return /^[/|.|\\]/.test(dependence)
    }
}

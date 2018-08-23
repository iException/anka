import fs from 'fs-extra'
import path from 'path'
import system from '../config'

export default class Dependence {
    isNpmDependence (dependence) {
        if (/^(@|[A-Za-z0-1])/.test(dependence)) {
            const dependencePath = path.resolve(system.cwd, system.sourceNodeModules, dependence)
            if (fs.existsSync(dependencePath)) {
                return true
            }
        }
    }

    isLocalDependence (dependence) {
        return /^[/|.|\\]/.test(dependence)
    }
}

import * as fs from 'fs-extra'
import * as path from 'path'

const cwd = process.cwd()

export default function (names: Array<string> = [], root?: string): Object {
    const defaultValue = {}
    const configPaths = names.map(name => path.join(root || cwd, name))

    for (let index = 0; index < configPaths.length; index++) {
        const configPath = configPaths[index]

        if (fs.existsSync(configPath)) {
            Object.assign(defaultValue, require(configPath))
            break
        }
    }

    return defaultValue
}

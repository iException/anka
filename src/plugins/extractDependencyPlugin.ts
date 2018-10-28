import { Compiler } from '../core'

const dependencyPool = new Map<string, string>()

export default function (this: Compiler) {
    this.on('after-parse', compilation => {
        const file = compilation.file
        // const newCompthis.generateCompilation()
    })
}

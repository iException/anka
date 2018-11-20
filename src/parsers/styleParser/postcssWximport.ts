import * as postcss from 'postcss'

export default postcss.plugin('postcss-wximport', () => {
    return (root: postcss.Root) => {
        let imports: Array<string> = []

        root.walkAtRules('wximport', (rule: postcss.AtRule) => {
            imports.push(rule.params.replace(/\.\w+(?=['"]$)/, '.wxss'))
            rule.remove()
        })
        root.prepend(...imports.map((item: string) => {
            return {
                name: 'import',
                params: item
            }
        }))
        imports.length = 0
    }
})

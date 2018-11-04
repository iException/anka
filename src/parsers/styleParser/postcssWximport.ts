const postcss = require('postcss')

export default postcss.plugin('postcss-wximport', () => {
    return (root: any) => {
        root.walkAtRules('wximport', (rule: any) => {
            rule.name = 'import'
            rule.params = rule.params.replace(/\.\w+(?=['"]$)/, '.wxss')
        })
    }
})

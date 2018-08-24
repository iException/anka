import postcss from 'postcss'

export default postcss.plugin('postcss-wximport', () => {
    return root => {
        root.walkAtRules('wximport', rule => {
            rule.name = 'import'
            rule.params = rule.params.replace(/\.\w+(?=['"]$)/, '.wxss')
        })
    }
})

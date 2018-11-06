import baseConfig from './rollup.config.base'

export default Object.assign({}, baseConfig, {
    watch: {
        include: 'src/**/*.ts'
    }
})

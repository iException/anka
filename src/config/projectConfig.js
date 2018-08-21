import path from 'path'

export const appConfig = Object.assign({
    pages: [],
    subPackages: [],
    window: {
        navigationBarTitleText: 'Wechat'
    }
    // tabBar: {
    //     list: []
    // },
}, require(path.join(process.cwd(), './src/app.json')))

import log from '../util/log'
import Installer from '../class/Installer'

export default {
    command: 'install [module] [otherModules...]',
    alias: '',
    description: '安装小程序模块',
    on: {
        '--help' () {
            console.log(`
                install [module] 安装模块
            `)
        }
    },
    async action (module, otherModules) {
        const modules = [module, ...otherModules]
        const installer = new Installer(modules)

        try {
            const pkgs = await installer.install()
            await installer.inject(pkgs)
        } catch (err) {
            log.error('Install', '模块安装失败', err)
        }
    }
}

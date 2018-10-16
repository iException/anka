import {
    logger
} from '../../utils'
import Compilation from './Compilation'
import config from '../../config'
import * as utils from '../../utils'

/**
 * The core complier
 */
export default class Anka {
    config: Object
    plugins: {
        [eventName: string]: Array<Plugin>
    }
    loaders: {
        test: RegExp,
        loaders: Array<Loader>
    }

    constructor () {
        this.config = config

        if (config.ankaConfig.debug) {
            console.log(this.config)
        }

        this.mountLoaders()
        this.mountPlugins()

    }

    on (event: string, compilation: Compilation): void {

    }

    emit (event: string, compilation: Compilation): void {

    }

    mountLoaders (): void {

    }

    mountPlugins (): void {

    }
}

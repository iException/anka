import config from './config'
import commands, {
    Prod,
    Dev,
    Init,
    CreatePage,
    CreateComponent,
    EnrollComponent
} from './commands'
import Compiler from './core/class/Compiler'

export default {
    config,
    commands,
    Compiler,
    Commands: {
        Prod,
        Dev,
        Init,
        CreatePage,
        CreateComponent,
        EnrollComponent
    }
}

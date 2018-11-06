import Dev from './commands/dev'
import Prod from './commands/prod'
import CreatePage from './commands/createPage'
import CreateComponent from './commands/createComponent'

export default [
    new Prod(),
    new Dev(),
    new CreatePage(),
    new CreateComponent()
]

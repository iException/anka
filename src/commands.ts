import Dev from './commands/dev'
import Prod from './commands/prod'
import CreatePage from './commands/createPage'
import CreateComponent from './commands/createComponent'
import EnrollComponent from './commands/enrollComponent'

export default [
    new Prod(),
    new Dev(),
    new CreatePage(),
    new CreateComponent(),
    new EnrollComponent()
]

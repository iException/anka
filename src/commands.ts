import Dev from './commands/dev'
import Prod from './commands/prod'
import CreatePage from './commands/createPage'

export default [
    new Prod(),
    new Dev(),
    new CreatePage()
]

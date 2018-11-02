import Dev from './commands/dev'
import Prod from './commands/prod'

export default [
    new Prod(),
    new Dev()
]

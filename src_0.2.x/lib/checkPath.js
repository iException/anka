const fs = require('fs-extra')

module.exports = function () {
    if (!fs.existsSync('./project.config.json')) {
        log.error('project.config.json 文件不存在！')
        process.exit(1)
    }
}
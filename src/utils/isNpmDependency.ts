declare type ValidateNpmPackageName = {
    validForNewPackages: boolean,
    validForOldPackages: boolean
}

const validate = require('validate-npm-package-name')

export default function (required: string = '') {
    const result = <ValidateNpmPackageName>validate(required.split('/').slice(0, 2).join('/'))

    return result.validForNewPackages || result.validForOldPackages
}

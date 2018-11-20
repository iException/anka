declare type ValidateNpmPackageName = {
    validForNewPackages: boolean,
    validForOldPackages: boolean
}

const validate = require('validate-npm-package-name')

export default function (required: string = ''): boolean {
    const result = <ValidateNpmPackageName>validate(required)

    return result.validForNewPackages || result.validForOldPackages
}

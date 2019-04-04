import isNpmDependency from '../../../src/utils/isNpmDependency'
import expect = require('expect')

const resovleModuleName = require('require-package-name')

describe('Utils:isNpmDependency', () => {
    it('common package', () => {
        expect(isNpmDependency('packagename')).toBeTruthy()
        expect(isNpmDependency('./packagename')).toBeFalsy()
    })

    it('scoped package', () => {
        expect(isNpmDependency('@scope/packagename')).toBeTruthy()
        expect(isNpmDependency('./@scope/packagename')).toBeFalsy()
    })

    it('resolve common package', () => {
        expect(resovleModuleName('packagename/index.js')).toEqual('packagename')
    })

    it('resolve scoped package', () => {
        expect(resovleModuleName('@scope/packagename/index.js')).toEqual('@scope/packagename')
    })
})

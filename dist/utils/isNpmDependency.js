"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var validate = require('validate-npm-package-name');
function default_1(required) {
    if (required === void 0) { required = ''; }
    var result = validate(required);
    return result.validForNewPackages || result.validForOldPackages;
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXNOcG1EZXBlbmRlbmN5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3V0aWxzL2lzTnBtRGVwZW5kZW5jeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUtBLElBQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQywyQkFBMkIsQ0FBQyxDQUFBO0FBRXJELG1CQUF5QixRQUFxQjtJQUFyQix5QkFBQSxFQUFBLGFBQXFCO0lBQzFDLElBQU0sTUFBTSxHQUEyQixRQUFRLENBQUMsUUFBUSxDQUFDLENBQUE7SUFFekQsT0FBTyxNQUFNLENBQUMsbUJBQW1CLElBQUksTUFBTSxDQUFDLG1CQUFtQixDQUFBO0FBQ25FLENBQUM7QUFKRCw0QkFJQyJ9
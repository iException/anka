"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var path = require("path");
var resolveConfig_1 = require("../utils/resolveConfig");
var ankaDefaultConfig = require("./ankaDefaultConfig");
var cwd = process.cwd();
var customConfig = resolveConfig_1.default(['anka.config.js', 'anka.config.json']);
function mergeArray() {
    var arrs = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        arrs[_i] = arguments[_i];
    }
    return arrs.filter(function (arr) { return arr && arr.length; }).reduce(function (prev, next) {
        return prev.concat(next);
    }, []);
}
exports.default = __assign({}, ankaDefaultConfig, customConfig, { template: customConfig.template ? {
        page: path.join(cwd, customConfig.template.page),
        component: path.join(cwd, customConfig.template.component)
    } : ankaDefaultConfig.template, parsers: mergeArray(customConfig.parsers, ankaDefaultConfig.parsers), plugins: mergeArray(customConfig.plugins, ankaDefaultConfig.plugins), ignored: mergeArray(customConfig.ignored, ankaDefaultConfig.ignored) });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5rYUNvbmZpZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb25maWcvYW5rYUNvbmZpZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0FBQUEsMkJBQTRCO0FBQzVCLHdEQUFrRDtBQUNsRCx1REFBd0Q7QUFNeEQsSUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFBO0FBQ3pCLElBQU0sWUFBWSxHQUFlLHVCQUFhLENBQUMsQ0FBQyxnQkFBZ0IsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDLENBQUE7QUFFdEYsU0FBUyxVQUFVO0lBQU0sY0FBbUI7U0FBbkIsVUFBbUIsRUFBbkIscUJBQW1CLEVBQW5CLElBQW1CO1FBQW5CLHlCQUFtQjs7SUFDeEMsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQUEsR0FBRyxJQUFJLE9BQUEsR0FBRyxJQUFJLEdBQUcsQ0FBQyxNQUFNLEVBQWpCLENBQWlCLENBQUMsQ0FBQyxNQUFNLENBQUMsVUFBQyxJQUFJLEVBQUUsSUFBSTtRQUMzRCxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUE7SUFDNUIsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFBO0FBQ1YsQ0FBQztBQUVELCtCQUNPLGlCQUFpQixFQUNqQixZQUFZLElBQ2YsUUFBUSxFQUFFLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBQzlCLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxZQUFZLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQztRQUNoRCxTQUFTLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsWUFBWSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUM7S0FDN0QsQ0FBQyxDQUFDLENBQUMsaUJBQWlCLENBQUMsUUFBUSxFQUM5QixPQUFPLEVBQUUsVUFBVSxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsaUJBQWlCLENBQUMsT0FBTyxDQUFDLEVBQ3BFLE9BQU8sRUFBRSxVQUFVLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsRUFDcEUsT0FBTyxFQUFFLFVBQVUsQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxJQUN2RSJ9
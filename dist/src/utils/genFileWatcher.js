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
var chokidar = require("chokidar");
function default_1(dir, options) {
    return chokidar.watch(dir, __assign({ persistent: true, ignoreInitial: true }, options));
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuRmlsZVdhdGNoZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvdXRpbHMvZ2VuRmlsZVdhdGNoZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQUFBLG1DQUFvQztBQUVwQyxtQkFBeUIsR0FBc0IsRUFBRSxPQUErQjtJQUM1RSxPQUFPLFFBQVEsQ0FBQyxLQUFLLENBQUMsR0FBRyxhQUNyQixVQUFVLEVBQUUsSUFBSSxFQUNoQixhQUFhLEVBQUUsSUFBSSxJQUNoQixPQUFPLEVBQ1osQ0FBQTtBQUNOLENBQUM7QUFORCw0QkFNQyJ9
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var logger_1 = require("./logger");
var normalize = require('normalize-path');
function default_1(id, options) {
    try {
        return normalize(require.resolve(id, options));
    }
    catch (err) {
        logger_1.default.error('Compile', id, new Error("Missing dependency " + id + " in " + options.paths));
    }
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb2x2ZU1vZHVsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy9yZXNvbHZlTW9kdWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsbUNBQTBCO0FBRzFCLElBQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFBO0FBRTNDLG1CQUF5QixFQUFVLEVBQUUsT0FBOEI7SUFDL0QsSUFBSTtRQUNBLE9BQU8sU0FBUyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUE7S0FDakQ7SUFBQyxPQUFPLEdBQUcsRUFBRTtRQUNWLGdCQUFHLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxFQUFFLEVBQUUsSUFBSSxLQUFLLENBQUMsd0JBQXNCLEVBQUUsWUFBTyxPQUFPLENBQUMsS0FBTyxDQUFDLENBQUMsQ0FBQTtLQUN0RjtBQUNMLENBQUM7QUFORCw0QkFNQyJ9
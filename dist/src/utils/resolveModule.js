"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var logger_1 = require("./logger");
function default_1(id, options) {
    try {
        return require.resolve(id, options);
    }
    catch (err) {
        logger_1.default.error('Compile', id, new Error("Missing dependency " + id + " in " + options.paths));
    }
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb2x2ZU1vZHVsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy91dGlscy9yZXNvbHZlTW9kdWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsbUNBQTBCO0FBRzFCLG1CQUF5QixFQUFVLEVBQUUsT0FBOEI7SUFDL0QsSUFBSTtRQUNBLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUE7S0FDdEM7SUFBQyxPQUFPLEdBQUcsRUFBRTtRQUNWLGdCQUFHLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxFQUFFLEVBQUUsSUFBSSxLQUFLLENBQUMsd0JBQXNCLEVBQUUsWUFBTyxPQUFPLENBQUMsS0FBTyxDQUFDLENBQUMsQ0FBQTtLQUN0RjtBQUNMLENBQUM7QUFORCw0QkFNQyJ9
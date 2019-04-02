"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var chalk_1 = require("chalk");
var messager_1 = require("./messager");
var ora = require('ora');
function toFix(number) {
    return ('00' + number).slice(-2);
}
exports.toFix = toFix;
function getCurrentTime() {
    var now = new Date();
    return toFix(now.getHours()) + ":" + toFix(now.getMinutes()) + ":" + toFix(now.getSeconds());
}
exports.getCurrentTime = getCurrentTime;
var Logger = (function () {
    function Logger() {
    }
    Object.defineProperty(Logger.prototype, "time", {
        get: function () {
            return chalk_1.default.grey("[" + getCurrentTime() + "]");
        },
        enumerable: true,
        configurable: true
    });
    Logger.prototype.startLoading = function (msg) {
        this.oraInstance = ora(msg).start();
    };
    Logger.prototype.stopLoading = function () {
        this.oraInstance && this.oraInstance.stop();
    };
    Logger.prototype.log = function () {
        var msg = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            msg[_i] = arguments[_i];
        }
        return console.log([this.time].concat(msg).join(' '));
    };
    Logger.prototype.error = function (title, msg, err) {
        if (title === void 0) { title = ''; }
        if (msg === void 0) { msg = ''; }
        if (err === void (0)) {
            err = new Error('');
        }
        err.message = chalk_1.default.hex('#333333').bgRedBright(" " + title.trim() + " ") + ' ' + chalk_1.default.grey(msg) + '\r\n'.repeat(2) + err.message;
        messager_1.default.push(err);
    };
    Logger.prototype.info = function (title, msg) {
        if (title === void 0) { title = ''; }
        if (msg === void 0) { msg = ''; }
        messager_1.default.push(this.time + ' ' + chalk_1.default.reset(title) + ' ' + chalk_1.default.grey(msg));
    };
    Logger.prototype.warn = function (title, msg) {
        if (title === void 0) { title = ''; }
        if (msg === void 0) { msg = ''; }
        this.stopLoading();
        console.clear();
        this.log(chalk_1.default.hex('#333333').bgYellowBright(" " + title.trim() + " "), chalk_1.default.grey(msg));
    };
    Logger.prototype.success = function (title, msg) {
        if (title === void 0) { title = ''; }
        if (msg === void 0) { msg = ''; }
        this.stopLoading();
        console.clear();
        this.log(chalk_1.default.hex('#333333').bgGreenBright(" " + title.trim() + " "), chalk_1.default.grey(msg));
    };
    return Logger;
}());
exports.Logger = Logger;
exports.default = new Logger();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3V0aWxzL2xvZ2dlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLCtCQUF5QjtBQUN6Qix1Q0FBaUM7QUFFakMsSUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFBO0FBRTFCLFNBQWdCLEtBQUssQ0FBRSxNQUFjO0lBQ2pDLE9BQU8sQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7QUFDcEMsQ0FBQztBQUZELHNCQUVDO0FBRUQsU0FBZ0IsY0FBYztJQUMxQixJQUFNLEdBQUcsR0FBRyxJQUFJLElBQUksRUFBRSxDQUFBO0lBQ3RCLE9BQVUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxTQUFJLEtBQUssQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLENBQUMsU0FBSSxLQUFLLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxDQUFHLENBQUE7QUFDM0YsQ0FBQztBQUhELHdDQUdDO0FBRUQ7SUFBQTtJQTBDQSxDQUFDO0lBdkNHLHNCQUFJLHdCQUFJO2FBQVI7WUFDSSxPQUFPLGVBQUssQ0FBQyxJQUFJLENBQUMsTUFBSSxjQUFjLEVBQUUsTUFBRyxDQUFDLENBQUE7UUFDOUMsQ0FBQzs7O09BQUE7SUFFRCw2QkFBWSxHQUFaLFVBQWMsR0FBVztRQUNyQixJQUFJLENBQUMsV0FBVyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQTtJQUN2QyxDQUFDO0lBRUQsNEJBQVcsR0FBWDtRQUNJLElBQUksQ0FBQyxXQUFXLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQTtJQUMvQyxDQUFDO0lBRUQsb0JBQUcsR0FBSDtRQUFLLGFBQXFCO2FBQXJCLFVBQXFCLEVBQXJCLHFCQUFxQixFQUFyQixJQUFxQjtZQUFyQix3QkFBcUI7O1FBQ3RCLE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLFNBQUssR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFBO0lBQ3JELENBQUM7SUFFRCxzQkFBSyxHQUFMLFVBQU8sS0FBa0IsRUFBRSxHQUFnQixFQUFFLEdBQVc7UUFBakQsc0JBQUEsRUFBQSxVQUFrQjtRQUFFLG9CQUFBLEVBQUEsUUFBZ0I7UUFDdkMsSUFBSSxHQUFHLEtBQUssS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFO1lBQ2xCLEdBQUcsR0FBRyxJQUFJLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQTtTQUN0QjtRQUNELEdBQUcsQ0FBQyxPQUFPLEdBQUcsZUFBSyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxXQUFXLENBQUMsTUFBSSxLQUFLLENBQUMsSUFBSSxFQUFFLE1BQUcsQ0FBQyxHQUFHLEdBQUcsR0FBRyxlQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQTtRQUM1SCxrQkFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQTtJQUN0QixDQUFDO0lBRUQscUJBQUksR0FBSixVQUFNLEtBQWtCLEVBQUUsR0FBZ0I7UUFBcEMsc0JBQUEsRUFBQSxVQUFrQjtRQUFFLG9CQUFBLEVBQUEsUUFBZ0I7UUFDdEMsa0JBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksR0FBRyxHQUFHLEdBQUcsZUFBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxHQUFHLEdBQUcsZUFBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFBO0lBQy9FLENBQUM7SUFFRCxxQkFBSSxHQUFKLFVBQU0sS0FBa0IsRUFBRSxHQUFnQjtRQUFwQyxzQkFBQSxFQUFBLFVBQWtCO1FBQUUsb0JBQUEsRUFBQSxRQUFnQjtRQUN0QyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUE7UUFDbEIsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFBO1FBQ2YsSUFBSSxDQUFDLEdBQUcsQ0FBQyxlQUFLLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxNQUFJLEtBQUssQ0FBQyxJQUFJLEVBQUUsTUFBRyxDQUFDLEVBQUUsZUFBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFBO0lBQ3ZGLENBQUM7SUFFRCx3QkFBTyxHQUFQLFVBQVMsS0FBa0IsRUFBRSxHQUFnQjtRQUFwQyxzQkFBQSxFQUFBLFVBQWtCO1FBQUUsb0JBQUEsRUFBQSxRQUFnQjtRQUN6QyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUE7UUFDbEIsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFBO1FBQ2YsSUFBSSxDQUFDLEdBQUcsQ0FBQyxlQUFLLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxNQUFJLEtBQUssQ0FBQyxJQUFJLEVBQUUsTUFBRyxDQUFDLEVBQUUsZUFBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFBO0lBQ3RGLENBQUM7SUFDTCxhQUFDO0FBQUQsQ0FBQyxBQTFDRCxJQTBDQztBQTFDWSx3QkFBTTtBQTRDbkIsa0JBQWUsSUFBSSxNQUFNLEVBQUUsQ0FBQSJ9
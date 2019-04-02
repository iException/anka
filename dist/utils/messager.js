"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var logger_1 = require("./logger");
var ankaConfig_1 = require("../config/ankaConfig");
var Messager = (function () {
    function Messager() {
        this.errors = [];
        this.messages = [];
    }
    Messager.prototype.push = function (msg) {
        if (msg instanceof Error) {
            this.errors.push(msg);
        }
        else {
            this.messages.push(msg);
        }
    };
    Messager.prototype.clear = function () {
        this.errors = [];
        this.messages = [];
    };
    Messager.prototype.hasError = function () {
        return !!this.errors.length;
    };
    Messager.prototype.printError = function () {
        logger_1.default.stopLoading();
        console.clear();
        logger_1.default.error(">>> " + this.errors.length + " errors occurred");
        console.log(this.errors.pop().message);
        this.errors.forEach(function (err) {
            console.error(err.message, '\r\n\r\n');
            ankaConfig_1.default.debug && console.log(err.stack);
        });
        this.errors = [];
    };
    Messager.prototype.printInfo = function () {
        logger_1.default.stopLoading();
        this.messages.forEach(function (info) {
            console.info(info);
        });
        this.messages = [];
    };
    return Messager;
}());
exports.Messager = Messager;
exports.default = new Messager();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVzc2FnZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdXRpbHMvbWVzc2FnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxtQ0FBNkI7QUFDN0IsbURBQTZDO0FBRTdDO0lBQUE7UUFDVyxXQUFNLEdBQWlCLEVBQUUsQ0FBQTtRQUN6QixhQUFRLEdBQTBCLEVBQUUsQ0FBQTtJQXNDL0MsQ0FBQztJQXBDRyx1QkFBSSxHQUFKLFVBQU0sR0FBbUI7UUFDckIsSUFBSSxHQUFHLFlBQVksS0FBSyxFQUFFO1lBQ3RCLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFBO1NBQ3hCO2FBQU07WUFDSCxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBUyxHQUFHLENBQUMsQ0FBQTtTQUNsQztJQUNMLENBQUM7SUFFRCx3QkFBSyxHQUFMO1FBQ0ksSUFBSSxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUE7UUFDaEIsSUFBSSxDQUFDLFFBQVEsR0FBRyxFQUFFLENBQUE7SUFDdEIsQ0FBQztJQUVELDJCQUFRLEdBQVI7UUFDSSxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQTtJQUMvQixDQUFDO0lBRUQsNkJBQVUsR0FBVjtRQUNJLGdCQUFNLENBQUMsV0FBVyxFQUFFLENBQUE7UUFDcEIsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFBO1FBQ2YsZ0JBQU0sQ0FBQyxLQUFLLENBQUMsU0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0scUJBQWtCLENBQUMsQ0FBQTtRQUN6RCxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUE7UUFDdEMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsVUFBQyxHQUFVO1lBQzNCLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxVQUFVLENBQUMsQ0FBQTtZQUN0QyxvQkFBVSxDQUFDLEtBQUssSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUM5QyxDQUFDLENBQUMsQ0FBQTtRQUNGLElBQUksQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFBO0lBQ3BCLENBQUM7SUFDRCw0QkFBUyxHQUFUO1FBQ0ksZ0JBQU0sQ0FBQyxXQUFXLEVBQUUsQ0FBQTtRQUNwQixJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxVQUFDLElBQVk7WUFDL0IsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUN0QixDQUFDLENBQUMsQ0FBQTtRQUVGLElBQUksQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFBO0lBQ3RCLENBQUM7SUFDTCxlQUFDO0FBQUQsQ0FBQyxBQXhDRCxJQXdDQztBQXhDWSw0QkFBUTtBQTBDckIsa0JBQWUsSUFBSSxRQUFRLEVBQUUsQ0FBQSJ9
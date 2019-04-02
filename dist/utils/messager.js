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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVzc2FnZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdXRpbHMvbWVzc2FnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxtQ0FBNkI7QUFDN0IsbURBQTZDO0FBRTdDO0lBQUE7UUFDVyxXQUFNLEdBQWlCLEVBQUUsQ0FBQTtRQUN6QixhQUFRLEdBQTBCLEVBQUUsQ0FBQTtJQXNDL0MsQ0FBQztJQXBDRyx1QkFBSSxHQUFKLFVBQU0sR0FBVztRQUNiLElBQUksR0FBRyxZQUFZLEtBQUssRUFBRTtZQUN0QixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQTtTQUN4QjthQUFNO1lBQ0gsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQVMsR0FBRyxDQUFDLENBQUE7U0FDbEM7SUFDTCxDQUFDO0lBRUQsd0JBQUssR0FBTDtRQUNJLElBQUksQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFBO1FBQ2hCLElBQUksQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFBO0lBQ3RCLENBQUM7SUFFRCwyQkFBUSxHQUFSO1FBQ0ksT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUE7SUFDL0IsQ0FBQztJQUVELDZCQUFVLEdBQVY7UUFDSSxnQkFBTSxDQUFDLFdBQVcsRUFBRSxDQUFBO1FBQ3BCLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQTtRQUNmLGdCQUFNLENBQUMsS0FBSyxDQUFDLFNBQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLHFCQUFrQixDQUFDLENBQUE7UUFDekQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFBO1FBQ3RDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLFVBQUMsR0FBVTtZQUMzQixPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsVUFBVSxDQUFDLENBQUE7WUFDdEMsb0JBQVUsQ0FBQyxLQUFLLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUE7UUFDOUMsQ0FBQyxDQUFDLENBQUE7UUFDRixJQUFJLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQTtJQUNwQixDQUFDO0lBQ0QsNEJBQVMsR0FBVDtRQUNJLGdCQUFNLENBQUMsV0FBVyxFQUFFLENBQUE7UUFDcEIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsVUFBQyxJQUFZO1lBQy9CLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDdEIsQ0FBQyxDQUFDLENBQUE7UUFFRixJQUFJLENBQUMsUUFBUSxHQUFHLEVBQUUsQ0FBQTtJQUN0QixDQUFDO0lBQ0wsZUFBQztBQUFELENBQUMsQUF4Q0QsSUF3Q0M7QUF4Q1ksNEJBQVE7QUEwQ3JCLGtCQUFlLElBQUksUUFBUSxFQUFFLENBQUEifQ==
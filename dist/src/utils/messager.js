"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var logger_1 = require("./logger");
var ankaConfig_1 = require("../config/ankaConfig");
exports.default = {
    errors: [],
    messages: [],
    push: function (msg) {
        if (msg instanceof Error) {
            this.errors.push(msg);
        }
        else {
            this.messages.push(msg);
        }
    },
    clear: function () {
        this.errors = [];
        this.messages = [];
    },
    hasError: function () {
        return !!this.errors.length;
    },
    printError: function () {
        logger_1.default.stopLoading();
        console.clear();
        logger_1.default.error(">>> " + this.errors.length + " errors occurred");
        console.log(this.errors.pop().message);
        this.errors.forEach(function (err) {
            console.error(err.message, '\r\n\r\n');
            ankaConfig_1.default.debug && console.log(err.stack);
        });
        this.errors = [];
    },
    printInfo: function () {
        logger_1.default.stopLoading();
        this.messages.forEach(function (info) {
            console.info(info);
        });
        this.messages = [];
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVzc2FnZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvdXRpbHMvbWVzc2FnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxtQ0FBNkI7QUFDN0IsbURBQTZDO0FBRTdDLGtCQUFlO0lBQ1gsTUFBTSxFQUFFLEVBQUU7SUFDVixRQUFRLEVBQUUsRUFBRTtJQUNaLElBQUksRUFBSixVQUFNLEdBQVc7UUFDYixJQUFJLEdBQUcsWUFBWSxLQUFLLEVBQUU7WUFDdEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUE7U0FDeEI7YUFBTTtZQUNILElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFBO1NBQzFCO0lBQ0wsQ0FBQztJQUNELEtBQUssRUFBTDtRQUNJLElBQUksQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFBO1FBQ2hCLElBQUksQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFBO0lBQ3RCLENBQUM7SUFDRCxRQUFRLEVBQVI7UUFDSSxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQTtJQUMvQixDQUFDO0lBQ0QsVUFBVSxFQUFWO1FBQ0ksZ0JBQU0sQ0FBQyxXQUFXLEVBQUUsQ0FBQTtRQUNwQixPQUFPLENBQUMsS0FBSyxFQUFFLENBQUE7UUFDZixnQkFBTSxDQUFDLEtBQUssQ0FBQyxTQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxxQkFBa0IsQ0FBQyxDQUFBO1FBQ3pELE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQTtRQUN0QyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxVQUFDLEdBQVU7WUFDM0IsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBQyxDQUFBO1lBQ3RDLG9CQUFVLENBQUMsS0FBSyxJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBQzlDLENBQUMsQ0FBQyxDQUFBO1FBQ0YsSUFBSSxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUE7SUFDcEIsQ0FBQztJQUNELFNBQVMsRUFBVDtRQUNJLGdCQUFNLENBQUMsV0FBVyxFQUFFLENBQUE7UUFDcEIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsVUFBQyxJQUFZO1lBQy9CLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDdEIsQ0FBQyxDQUFDLENBQUE7UUFFRixJQUFJLENBQUMsUUFBUSxHQUFHLEVBQUUsQ0FBQTtJQUN0QixDQUFDO0NBQ0osQ0FBQSJ9
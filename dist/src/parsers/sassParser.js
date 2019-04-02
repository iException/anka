"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var sass = require("node-sass");
exports.default = (function (file, compilation, callback) {
    var utils = this.getUtils();
    var config = this.getSystemConfig();
    file.content = file.content instanceof Buffer ? file.content.toString() : file.content;
    sass.render({
        file: file.sourceFile,
        data: file.content
    }, function (err, result) {
        if (err) {
            utils.logger.error('Compile', file.sourceFile, err);
            compilation.destroy();
        }
        else {
            file.content = result.css;
            file.updateExt('.wxss');
        }
        callback();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Fzc1BhcnNlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9wYXJzZXJzL3Nhc3NQYXJzZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxnQ0FBaUM7QUFhakMsbUJBQXVCLFVBQWlDLElBQVUsRUFBRSxXQUF3QixFQUFFLFFBQW1CO0lBQzdHLElBQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQTtJQUM3QixJQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUE7SUFFckMsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxZQUFZLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQTtJQUV0RixJQUFJLENBQUMsTUFBTSxDQUFDO1FBQ1IsSUFBSSxFQUFFLElBQUksQ0FBQyxVQUFVO1FBQ3JCLElBQUksRUFBRSxJQUFJLENBQUMsT0FBTztLQUNyQixFQUFFLFVBQUMsR0FBVSxFQUFFLE1BQVc7UUFDdkIsSUFBSSxHQUFHLEVBQUU7WUFDTCxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLFVBQVUsRUFBRSxHQUFHLENBQUMsQ0FBQTtZQUNuRCxXQUFXLENBQUMsT0FBTyxFQUFFLENBQUE7U0FDeEI7YUFBTTtZQUNILElBQUksQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQTtZQUN6QixJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFBO1NBQzFCO1FBQ0QsUUFBUSxFQUFFLENBQUE7SUFDZCxDQUFDLENBQUMsQ0FBQTtBQUNOLENBQUMsRUFBQSJ9
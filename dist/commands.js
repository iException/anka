"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var dev_1 = require("./commands/dev");
exports.Dev = dev_1.default;
var init_1 = require("./commands/init");
exports.Init = init_1.default;
var prod_1 = require("./commands/prod");
exports.Prod = prod_1.default;
var createPage_1 = require("./commands/createPage");
exports.CreatePage = createPage_1.default;
var createComponent_1 = require("./commands/createComponent");
exports.CreateComponent = createComponent_1.default;
var enrollComponent_1 = require("./commands/enrollComponent");
exports.EnrollComponent = enrollComponent_1.default;
exports.default = [
    new prod_1.default(),
    new dev_1.default(),
    new init_1.default(),
    new createPage_1.default(),
    new createComponent_1.default(),
    new enrollComponent_1.default()
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvY29tbWFuZHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxzQ0FBZ0M7QUFrQjVCLGNBbEJHLGFBQUcsQ0FrQkg7QUFqQlAsd0NBQWtDO0FBa0I5QixlQWxCRyxjQUFJLENBa0JIO0FBakJSLHdDQUFrQztBQWU5QixlQWZHLGNBQUksQ0FlSDtBQWRSLG9EQUE4QztBQWlCMUMscUJBakJHLG9CQUFVLENBaUJIO0FBaEJkLDhEQUF3RDtBQWlCcEQsMEJBakJHLHlCQUFlLENBaUJIO0FBaEJuQiw4REFBd0Q7QUFpQnBELDBCQWpCRyx5QkFBZSxDQWlCSDtBQWZuQixrQkFBZTtJQUNYLElBQUksY0FBSSxFQUFFO0lBQ1YsSUFBSSxhQUFHLEVBQUU7SUFDVCxJQUFJLGNBQUksRUFBRTtJQUNWLElBQUksb0JBQVUsRUFBRTtJQUNoQixJQUFJLHlCQUFlLEVBQUU7SUFDckIsSUFBSSx5QkFBZSxFQUFFO0NBQ3hCLENBQUEifQ==
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var system = require("./systemConfig");
var resolveConfig_1 = require("../utils/resolveConfig");
var customConfig = resolveConfig_1.default(['app.json'], system.srcDir);
exports.default = Object.assign({
    pages: [],
    subPackages: [],
    window: {
        navigationBarTitleText: 'Wechat'
    }
}, customConfig);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvamVjdENvbmZpZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb25maWcvcHJvamVjdENvbmZpZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUdBLHVDQUF3QztBQUN4Qyx3REFBa0Q7QUFFbEQsSUFBTSxZQUFZLEdBQUcsdUJBQWEsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQTtBQUUvRCxrQkFBZSxNQUFNLENBQUMsTUFBTSxDQUFDO0lBQ3pCLEtBQUssRUFBRSxFQUFFO0lBQ1QsV0FBVyxFQUFFLEVBQUU7SUFDZixNQUFNLEVBQUU7UUFDSixzQkFBc0IsRUFBRSxRQUFRO0tBQ25DO0NBSUosRUFBRSxZQUFZLENBQUMsQ0FBQSJ9
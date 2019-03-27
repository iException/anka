"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var path = require("path");
var sassParser_1 = require("../parsers/sassParser");
var styleParser_1 = require("../parsers/styleParser");
var babelParser_1 = require("../parsers/babelParser");
var saveFilePlugin_1 = require("../plugins/saveFilePlugin");
var wxImportPlugin_1 = require("../plugins/wxImportPlugin");
var typescriptParser_1 = require("../parsers/typescriptParser");
var extractDependencyPlugin_1 = require("../plugins/extractDependencyPlugin");
exports.sourceDir = './src';
exports.outputDir = './dist';
exports.pages = './pages';
exports.components = './components';
exports.template = {
    page: path.join(__dirname, '../template/page'),
    component: path.join(__dirname, '../template/component')
};
exports.subPackages = './subPackages';
exports.quiet = false;
exports.devMode = false;
exports.parsers = [
    {
        match: /.*\.(js|es)$/,
        parsers: [
            {
                parser: babelParser_1.default,
                options: {}
            }
        ]
    },
    {
        match: /.*\.(wxss|css|postcss)$/,
        parsers: [
            {
                parser: styleParser_1.default,
                options: {}
            }
        ]
    },
    {
        match: /.*\.(sass|scss)$/,
        parsers: [
            {
                parser: sassParser_1.default,
                options: {}
            }
        ]
    },
    {
        match: /.*\.(ts|typescript)$/,
        parsers: [
            {
                parser: typescriptParser_1.default,
                options: {}
            }
        ]
    }
];
exports.debug = false;
exports.plugins = [
    {
        plugin: extractDependencyPlugin_1.default,
        options: {}
    },
    {
        plugin: wxImportPlugin_1.default,
        options: {}
    },
    {
        plugin: saveFilePlugin_1.default,
        options: {}
    }
];
exports.ignored = [];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5rYURlZmF1bHRDb25maWcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY29uZmlnL2Fua2FEZWZhdWx0Q29uZmlnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQ0EsMkJBQTRCO0FBQzVCLG9EQUE4QztBQUU5QyxzREFBZ0Q7QUFDaEQsc0RBQWdEO0FBR2hELDREQUFzRDtBQUN0RCw0REFBc0Q7QUFDdEQsZ0VBQTBEO0FBQzFELDhFQUF3RTtBQWdCM0QsUUFBQSxTQUFTLEdBQUcsT0FBTyxDQUFBO0FBTW5CLFFBQUEsU0FBUyxHQUFHLFFBQVEsQ0FBQTtBQU1wQixRQUFBLEtBQUssR0FBRyxTQUFTLENBQUE7QUFNakIsUUFBQSxVQUFVLEdBQUcsY0FBYyxDQUFBO0FBSzNCLFFBQUEsUUFBUSxHQUFHO0lBQ3BCLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxrQkFBa0IsQ0FBQztJQUM5QyxTQUFTLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsdUJBQXVCLENBQUM7Q0FDM0QsQ0FBQTtBQU1ZLFFBQUEsV0FBVyxHQUFHLGVBQWUsQ0FBQTtBQVU3QixRQUFBLEtBQUssR0FBRyxLQUFLLENBQUE7QUFNYixRQUFBLE9BQU8sR0FBRyxLQUFLLENBQUE7QUFLZixRQUFBLE9BQU8sR0FBd0I7SUFDeEM7UUFDSSxLQUFLLEVBQUUsY0FBYztRQUNyQixPQUFPLEVBQUU7WUFDTDtnQkFDSSxNQUFNLEVBQUUscUJBQVc7Z0JBQ25CLE9BQU8sRUFBRSxFQUFFO2FBQ2Q7U0FDSjtLQUNKO0lBQ0Q7UUFDSSxLQUFLLEVBQUUseUJBQXlCO1FBQ2hDLE9BQU8sRUFBRTtZQUNMO2dCQUNJLE1BQU0sRUFBRSxxQkFBVztnQkFDbkIsT0FBTyxFQUFFLEVBQUU7YUFDZDtTQUNKO0tBQ0o7SUFDRDtRQUNJLEtBQUssRUFBRSxrQkFBa0I7UUFDekIsT0FBTyxFQUFFO1lBQ0w7Z0JBQ0ksTUFBTSxFQUFFLG9CQUFVO2dCQUNsQixPQUFPLEVBQUUsRUFBRTthQUNkO1NBQ0o7S0FDSjtJQUNEO1FBQ0ksS0FBSyxFQUFFLHNCQUFzQjtRQUM3QixPQUFPLEVBQUU7WUFDTDtnQkFDSSxNQUFNLEVBQUUsMEJBQWdCO2dCQUN4QixPQUFPLEVBQUUsRUFBRTthQUNkO1NBQ0o7S0FDSjtDQUNKLENBQUE7QUFNWSxRQUFBLEtBQUssR0FBWSxLQUFLLENBQUE7QUFLdEIsUUFBQSxPQUFPLEdBQXdCO0lBQ3hDO1FBQ0ksTUFBTSxFQUFFLGlDQUF1QjtRQUMvQixPQUFPLEVBQUUsRUFBRTtLQUNkO0lBQ0Q7UUFDSSxNQUFNLEVBQUUsd0JBQWM7UUFDdEIsT0FBTyxFQUFFLEVBQUU7S0FDZDtJQUNEO1FBQ0ksTUFBTSxFQUFFLHdCQUFjO1FBQ3RCLE9BQU8sRUFBRSxFQUFFO0tBQ2Q7Q0FDSixDQUFBO0FBS1ksUUFBQSxPQUFPLEdBQXdCLEVBQUUsQ0FBQSJ9
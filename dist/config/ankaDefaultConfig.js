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
exports.sourceDir = path.join('.', 'src');
exports.outputDir = path.join('.', 'dist');
exports.pages = path.join('.', 'pages');
exports.components = path.join('.', 'components');
exports.template = {
    page: path.join(__dirname, '..', 'template', 'page'),
    component: path.join(__dirname, '..', 'template', 'component')
};
exports.subPackages = path.join('.', 'subPackages');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5rYURlZmF1bHRDb25maWcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvY29uZmlnL2Fua2FEZWZhdWx0Q29uZmlnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQ0EsMkJBQTRCO0FBQzVCLG9EQUE4QztBQUU5QyxzREFBZ0Q7QUFDaEQsc0RBQWdEO0FBR2hELDREQUFzRDtBQUN0RCw0REFBc0Q7QUFDdEQsZ0VBQTBEO0FBQzFELDhFQUF3RTtBQWdCM0QsUUFBQSxTQUFTLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUE7QUFNakMsUUFBQSxTQUFTLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsTUFBTSxDQUFDLENBQUE7QUFNbEMsUUFBQSxLQUFLLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUE7QUFNL0IsUUFBQSxVQUFVLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsWUFBWSxDQUFDLENBQUE7QUFLekMsUUFBQSxRQUFRLEdBQUc7SUFDcEIsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsTUFBTSxDQUFDO0lBQ3BELFNBQVMsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLFdBQVcsQ0FBQztDQUNqRSxDQUFBO0FBTVksUUFBQSxXQUFXLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsYUFBYSxDQUFDLENBQUE7QUFVM0MsUUFBQSxLQUFLLEdBQUcsS0FBSyxDQUFBO0FBTWIsUUFBQSxPQUFPLEdBQUcsS0FBSyxDQUFBO0FBS2YsUUFBQSxPQUFPLEdBQXdCO0lBQ3hDO1FBQ0ksS0FBSyxFQUFFLGNBQWM7UUFDckIsT0FBTyxFQUFFO1lBQ0w7Z0JBQ0ksTUFBTSxFQUFFLHFCQUFXO2dCQUNuQixPQUFPLEVBQUUsRUFBRTthQUNkO1NBQ0o7S0FDSjtJQUNEO1FBQ0ksS0FBSyxFQUFFLHlCQUF5QjtRQUNoQyxPQUFPLEVBQUU7WUFDTDtnQkFDSSxNQUFNLEVBQUUscUJBQVc7Z0JBQ25CLE9BQU8sRUFBRSxFQUFFO2FBQ2Q7U0FDSjtLQUNKO0lBQ0Q7UUFDSSxLQUFLLEVBQUUsa0JBQWtCO1FBQ3pCLE9BQU8sRUFBRTtZQUNMO2dCQUNJLE1BQU0sRUFBRSxvQkFBVTtnQkFDbEIsT0FBTyxFQUFFLEVBQUU7YUFDZDtTQUNKO0tBQ0o7SUFDRDtRQUNJLEtBQUssRUFBRSxzQkFBc0I7UUFDN0IsT0FBTyxFQUFFO1lBQ0w7Z0JBQ0ksTUFBTSxFQUFFLDBCQUFnQjtnQkFDeEIsT0FBTyxFQUFFLEVBQUU7YUFDZDtTQUNKO0tBQ0o7Q0FDSixDQUFBO0FBTVksUUFBQSxLQUFLLEdBQVksS0FBSyxDQUFBO0FBS3RCLFFBQUEsT0FBTyxHQUF3QjtJQUN4QztRQUNJLE1BQU0sRUFBRSxpQ0FBdUI7UUFDL0IsT0FBTyxFQUFFLEVBQUU7S0FDZDtJQUNEO1FBQ0ksTUFBTSxFQUFFLHdCQUFjO1FBQ3RCLE9BQU8sRUFBRSxFQUFFO0tBQ2Q7SUFDRDtRQUNJLE1BQU0sRUFBRSx3QkFBYztRQUN0QixPQUFPLEVBQUUsRUFBRTtLQUNkO0NBQ0osQ0FBQTtBQUtZLFFBQUEsT0FBTyxHQUF3QixFQUFFLENBQUEifQ==
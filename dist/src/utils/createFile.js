"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("./fs");
var fs = require("fs-extra");
var File_1 = require("../core/class/File");
function createFile(sourceFile) {
    return fs_1.readFile(sourceFile).then(function (content) {
        return Promise.resolve(new File_1.default({
            sourceFile: sourceFile,
            content: content
        }));
    });
}
exports.createFile = createFile;
function createFileSync(sourceFile) {
    var content = fs.readFileSync(sourceFile);
    return new File_1.default({
        sourceFile: sourceFile,
        content: content
    });
}
exports.createFileSync = createFileSync;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlRmlsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy91dGlscy9jcmVhdGVGaWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsMkJBRWE7QUFFYiw2QkFBOEI7QUFDOUIsMkNBQXFDO0FBRXJDLFNBQWdCLFVBQVUsQ0FBRSxVQUFrQjtJQUMxQyxPQUFPLGFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBQSxPQUFPO1FBQ3BDLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLGNBQUksQ0FBQztZQUM1QixVQUFVLFlBQUE7WUFDVixPQUFPLFNBQUE7U0FDVixDQUFDLENBQUMsQ0FBQTtJQUNQLENBQUMsQ0FBQyxDQUFBO0FBQ04sQ0FBQztBQVBELGdDQU9DO0FBRUQsU0FBZ0IsY0FBYyxDQUFFLFVBQWtCO0lBQzlDLElBQU0sT0FBTyxHQUFHLEVBQUUsQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLENBQUE7SUFDM0MsT0FBTyxJQUFJLGNBQUksQ0FBQztRQUNaLFVBQVUsWUFBQTtRQUNWLE9BQU8sU0FBQTtLQUNWLENBQUMsQ0FBQTtBQUNOLENBQUM7QUFORCx3Q0FNQyJ9
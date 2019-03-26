"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var memFs = require('mem-fs');
var memFsEditor = require('mem-fs-editor');
var FsEditor = (function () {
    function FsEditor() {
        var store = memFs.create();
        this.editor = memFsEditor.create(store);
    }
    FsEditor.prototype.copy = function (from, to, context, templateOptions, copyOptions) {
        this.editor.copyTpl(from, to, context, templateOptions, copyOptions);
    };
    FsEditor.prototype.write = function (filepath, contents) {
        this.editor.write(filepath, contents);
    };
    FsEditor.prototype.writeJSON = function (filepath, contents, replacer, space) {
        this.editor.writeJSON(filepath, contents, replacer || null, space = 4);
    };
    FsEditor.prototype.read = function (filepath, options) {
        return this.editor.read(filepath, options);
    };
    FsEditor.prototype.readJSON = function (filepath, defaults) {
        this.editor.readJSON(filepath, defaults);
    };
    FsEditor.prototype.save = function () {
        var _this = this;
        return new Promise(function (resolve) {
            _this.editor.commit(resolve);
        });
    };
    return FsEditor;
}());
exports.default = FsEditor;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3V0aWxzL2VkaXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUdBLElBQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQTtBQUMvQixJQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsZUFBZSxDQUFDLENBQUE7QUFFNUM7SUFHSTtRQUNJLElBQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQTtRQUU1QixJQUFJLENBQUMsTUFBTSxHQUFHLFdBQVcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUE7SUFDM0MsQ0FBQztJQUVELHVCQUFJLEdBQUosVUFBTSxJQUFZLEVBQUUsRUFBVSxFQUFFLE9BQWUsRUFBRSxlQUFpQyxFQUFFLFdBQXFDO1FBQ3JILElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLGVBQWUsRUFBRSxXQUFXLENBQUMsQ0FBQTtJQUN4RSxDQUFDO0lBRUQsd0JBQUssR0FBTCxVQUFPLFFBQWdCLEVBQUUsUUFBOEI7UUFDbkQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFBO0lBQ3pDLENBQUM7SUFFRCw0QkFBUyxHQUFULFVBQVcsUUFBZ0IsRUFBRSxRQUFhLEVBQUUsUUFBbUMsRUFBRSxLQUF5QjtRQUN0RyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsUUFBUSxFQUFFLFFBQVEsSUFBSSxJQUFJLEVBQUUsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFBO0lBQzFFLENBQUM7SUFFRCx1QkFBSSxHQUFKLFVBQU0sUUFBZ0IsRUFBRSxPQUE0QztRQUNoRSxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQTtJQUM5QyxDQUFDO0lBRUQsMkJBQVEsR0FBUixVQUFVLFFBQWdCLEVBQUUsUUFBYztRQUN0QyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUE7SUFDNUMsQ0FBQztJQUVELHVCQUFJLEdBQUo7UUFBQSxpQkFJQztRQUhHLE9BQU8sSUFBSSxPQUFPLENBQUMsVUFBQSxPQUFPO1lBQ3RCLEtBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFBO1FBQy9CLENBQUMsQ0FBQyxDQUFBO0lBQ04sQ0FBQztJQUNMLGVBQUM7QUFBRCxDQUFDLEFBbENELElBa0NDIn0=
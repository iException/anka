"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var download_git_repo_1 = require("download-git-repo");
function default_1(repo, path) {
    return new Promise(function (resolve, reject) {
        download_git_repo_1.default(repo, path, { clone: false }, function (err) {
            err ? reject(err) : resolve();
        });
    });
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG93bmxvYWRSZXBlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3V0aWxzL2Rvd25sb2FkUmVwZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHVEQUE0QztBQUU1QyxtQkFBeUIsSUFBWSxFQUFFLElBQVk7SUFDL0MsT0FBTyxJQUFJLE9BQU8sQ0FBQyxVQUFDLE9BQU8sRUFBRSxNQUFNO1FBQy9CLDJCQUFZLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsRUFBRSxVQUFDLEdBQVU7WUFDbEQsR0FBRyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFBO1FBQ2pDLENBQUMsQ0FBQyxDQUFBO0lBQ04sQ0FBQyxDQUFDLENBQUE7QUFDTixDQUFDO0FBTkQsNEJBTUMifQ==
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function callPromiseInChain(list) {
    if (list === void 0) { list = []; }
    var params = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        params[_i - 1] = arguments[_i];
    }
    return new Promise(function (resolve, reject) {
        if (!list.length) {
            resolve();
            return;
        }
        var step = list[0].apply(list, params);
        var _loop_1 = function (i) {
            step = step.then(function () {
                return list[i].apply(list, params);
            });
        };
        for (var i = 1; i < list.length; i++) {
            _loop_1(i);
        }
        step.then(function (res) {
            resolve();
        }, function (err) {
            reject(err);
        });
    });
}
exports.default = callPromiseInChain;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FsbFByb21pc2VJbkNoYWluLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3V0aWxzL2NhbGxQcm9taXNlSW5DaGFpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLFNBQXdCLGtCQUFrQixDQUFFLElBQW9EO0lBQXBELHFCQUFBLEVBQUEsU0FBb0Q7SUFBRSxnQkFBcUI7U0FBckIsVUFBcUIsRUFBckIscUJBQXFCLEVBQXJCLElBQXFCO1FBQXJCLCtCQUFxQjs7SUFDbkgsT0FBTyxJQUFJLE9BQU8sQ0FBQyxVQUFDLE9BQU8sRUFBRSxNQUFNO1FBQy9CLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFHO1lBQ2YsT0FBTyxFQUFFLENBQUE7WUFDVCxPQUFNO1NBQ1Q7UUFDRCxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLE9BQVAsSUFBSSxFQUFPLE1BQU0sQ0FBQyxDQUFBO2dDQUVwQixDQUFDO1lBQ04sSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7Z0JBQ2IsT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDLE9BQVAsSUFBSSxFQUFPLE1BQU0sRUFBQztZQUM3QixDQUFDLENBQUMsQ0FBQTs7UUFITixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUU7b0JBQTNCLENBQUM7U0FJVDtRQUVELElBQUksQ0FBQyxJQUFJLENBQUMsVUFBQSxHQUFHO1lBQ1QsT0FBTyxFQUFFLENBQUE7UUFDYixDQUFDLEVBQUUsVUFBQSxHQUFHO1lBQ0YsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFBO1FBQ2YsQ0FBQyxDQUFDLENBQUE7SUFDTixDQUFDLENBQUMsQ0FBQTtBQUNOLENBQUM7QUFwQkQscUNBb0JDIn0=
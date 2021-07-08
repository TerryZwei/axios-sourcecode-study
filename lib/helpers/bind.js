'use strict';

// bind函数：传递函数fn和thisArg指向，返回wrap函数
// wrap函数：把当前的参数arguments转成是数组，作为fn函数的参数，最后返回fn函数的调用结果。
module.exports = function bind(fn, thisArg) {
  return function wrap() {
    var args = new Array(arguments.length);
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i];
    }
    // 使用apply是为了使函数内能够使用thisArg上的属性值
    // apply是支持arguments这样的伪数组对象，这里有一个疑问？为什么源码上要把arguments转成是数组再调用apply？
    return fn.apply(thisArg, args);
  };
};

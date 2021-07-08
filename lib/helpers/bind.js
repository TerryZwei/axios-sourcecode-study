'use strict';


module.exports = function bind(fn, thisArg) {
  return function wrap() {
    var args = new Array(arguments.length);
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i];
    }
    // apply是支持arguments这样的伪数组对象，这里有一个疑问？为什么源码上要把arguments转成是数组再调用apply？
    return fn.apply(thisArg, args);
  };
};

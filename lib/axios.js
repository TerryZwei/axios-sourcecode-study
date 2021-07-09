'use strict';

// 工具类
var utils = require('./utils');
var bind = require('./helpers/bind');
// Axios构造函数
var Axios = require('./core/Axios');
// mergeConfig(config1, config2); 把config2的属性合并到config1上，返回新的对象
var mergeConfig = require('./core/mergeConfig');
// 默认配置
var defaults = require('./defaults');

/**
 * 创建axios实例
 * @param {*} defaultConfig 实例上的默认配置
 * @returns Axios实例
 */
function createInstance(defaultConfig) {
  // 返回Axios实例 {defaults, interceptors}
  var context = new Axios(defaultConfig);
  
  // 这里bind返回一个wrap函数；
  // bind函数作用：调用instance相当于调用了Axios.prototype.request，并且把request的方法指向Axios实例context，换句话说执行axios就相当于执行Axios.prototype.request；
  var instance = bind(Axios.prototype.request, context);

  // Copy axios.prototype to instance
  // wrap是函数（js函数也是对象，可以在函数上添加其他属性）
  // wrap函数的基础上扩展Axios.prototype上的方法（get，post，patch，delete...），这里extend方法使我们可以调用axios.get()、axios.post()...
  utils.extend(instance, Axios.prototype, context);

  // Copy context to instance
  // wrap函数的基础上扩展defaults,interceptors属性
  utils.extend(instance, context);
  // 返回wrap函数
  // 现在的wrap函数身上绑定了get,post,put,delete,request...的方法，还有defaults，interceptors属性
  return instance;
}

// 创建实例对象
var axios = createInstance(defaults);

// 导出Axios类允许外部继承
axios.Axios = Axios;

// Factory for creating new instances
axios.create = function create(instanceConfig) {
  // 调用axios.create(config)传入的config会和默认的defaults进行合并，生成新的请求配置传入创建新的axios实例方法createInstance
  return createInstance(mergeConfig(axios.defaults, instanceConfig));
};

// 导出Cancel和CancelToken
axios.Cancel = require('./cancel/Cancel');
axios.CancelToken = require('./cancel/CancelToken');
axios.isCancel = require('./cancel/isCancel');

// Expose all/spread
axios.all = function all(promises) {
  return Promise.all(promises);
};
axios.spread = require('./helpers/spread');

module.exports = axios;

// Allow use of default import syntax in TypeScript
module.exports.default = axios;

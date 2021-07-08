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
  utils.extend(instance, Axios.prototype, context);

  // Copy context to instance
  utils.extend(instance, context);
  // debugger;
  return instance;
}

// 创建实例对象
var axios = createInstance(defaults);

// 导出Axios类允许外部继承
axios.Axios = Axios;

// Factory for creating new instances
axios.create = function create(instanceConfig) {
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

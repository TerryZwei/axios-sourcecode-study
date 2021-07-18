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
  
  // 把request方法里面的this绑定到实例对象context（{defaults, interceptors}）上
  var instance = bind(Axios.prototype.request, context);

  // instance是原型链上的request函数（this绑定在contenxt上）
  // 这里的extend函数就是把原型链上的所有请求方法都添加都instance函数上（js函数也是对象，也就是往函数上添加其他属性），并且把this都绑定在实例对象context上
  // 目的：使instance既可以执行，也可以调用属性方法(get、post、put、delete...)
  utils.extend(instance, Axios.prototype, context);

  // instance函数的基础上扩展defaults,interceptors属性
  utils.extend(instance, context);

  // 返回instance函数
  // 现在的instance函数身上绑定了get,post,put,delete,request...的方法，还有defaults，interceptors属性
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

// axios.all本质上就是调用Promise.all()
axios.all = function all(promises) {
  return Promise.all(promises);
};
axios.spread = require('./helpers/spread');

module.exports = axios;

// Allow use of default import syntax in TypeScript
module.exports.default = axios;

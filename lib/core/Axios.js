'use strict';

var utils = require('./../utils');
var buildURL = require('../helpers/buildURL');
var InterceptorManager = require('./InterceptorManager');
var dispatchRequest = require('./dispatchRequest');
// mergeConfig(config1, config2); 把config2的属性合并到config1上，返回新的对象
var mergeConfig = require('./mergeConfig');

/**
 * Axios类
 * 配置对象绑定在defaults属性
 * 拦截器实例（请求，响应）绑定在interrceptors属性
 * @param {*} instanceConfig 实例上的配置
 */
function Axios(instanceConfig) {
  this.defaults = instanceConfig;
  // 拦截器
  this.interceptors = {
    request: new InterceptorManager(),
    response: new InterceptorManager()
  };
}

/**
 * Dispatch a request
 * 发送请求方法
 * @param {Object} config The config specific for this request (merged with this.defaults)
 * @param {Object} config 合并defaults属性上的配置作为请求时候的最终配置
 */
Axios.prototype.request = function request(config) {
  /*eslint no-param-reassign:0*/
  // Allow for axios('example/url'[, config]) a la fetch API
  // 这个判断针对axios('接口地址url'[,config])这种情况
  if (typeof config === 'string') {
    config = arguments[1] || {};
    config.url = arguments[0];
  } else {
    config = config || {};
  }
  // 合并默认配置和当前配置
  config = mergeConfig(this.defaults, config);

  // Set config.method
  if (config.method) {
    config.method = config.method.toLowerCase();
  } else if (this.defaults.method) {
    config.method = this.defaults.method.toLowerCase();
  } else {
    // 默认get请求
    config.method = 'get';
  }

  var chain = [dispatchRequest, undefined];
  var promise = Promise.resolve(config);
  // 如果开发代码有调用interceptors里面的use方法，那么就是把拦截器里面的函数添加到handles数组里面，
  // 下面的forEach方法就是遍历handles的代码，分别把代码中use的回调函数添加到chain数组的最前面去，
  // 这里就是为什么拦截器会在真正的请求发送前面执行的原因，因为chain数组到时候会执行是按照顺序执行下去的
  // chain数组结构大概就是[请求拦截成功回调函数, 请求拦截的失败回调函数, 请求函数, undefined, 响应拦截成功函数, 响应拦截失败函数]
  this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
    chain.unshift(interceptor.fulfilled, interceptor.rejected);
  });

  // 把use里面的响应拦截函数放到chain数组的最后，然后利用promise按照chain数组的顺序去执行
  this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
    chain.push(interceptor.fulfilled, interceptor.rejected);
  });

  // 利用chain数组的长度来控制每一次的then操作
  // 这里类似于Promise.resolve({type: 'get'}).then(res => {}).then(res => {}).then(res => {})... 有多少个then取决于数组的长度/2，因为数组里面的包含成功，还有失败的回调。
  while (chain.length) {
    promise = promise.then(chain.shift(), chain.shift());
  }
  return promise;
};

Axios.prototype.getUri = function getUri(config) {
  config = mergeConfig(this.defaults, config);
  return buildURL(config.url, config.params, config.paramsSerializer).replace(/^\?/, '');
};


// 扩展不同的请求方法到Axios实例上，例如axios.get,axios.delete...
utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
  /*eslint func-names:0*/
  Axios.prototype[method] = function(url, config) {
    return this.request(mergeConfig(config || {}, {
      method: method,
      url: url,
      data: (config || {}).data
    }));
  };
});

utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
  /*eslint func-names:0*/
  Axios.prototype[method] = function(url, data, config) {
    return this.request(mergeConfig(config || {}, {
      method: method,
      url: url,
      data: data
    }));
  };
});

module.exports = Axios;

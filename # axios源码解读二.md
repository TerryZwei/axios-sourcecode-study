# axios源码解读二

通过源码的学习提升自己的编码能力和理解源码里面的设计模式，最终通过自己的理解，然后模仿做一个简易功能版本的轮子出来。希望通过这个源码系列来监督自己学习源码。

经过上一个篇章的阅读[axios源码解读（上）](https://juejin.cn/post/6986163536233758734)，知道axios本质上就是一个函数，既可以直接调用axios()，又可以当作对象使用axios.get()。接下来对核心的拦截器（interceptor）和网络请求源码（request）进行解读。



## 1. axios源码--发送请求

mergeConfig方法：



Axios构造函数里的原型方法request，所有的请求本质上都是调用这个方法。

```js
// 文件位置：lib/core/Axios.js
/**
 * 发送请求方法
 * @param {Object} config 合并defaults属性上的配置作为请求时候的配置
 */
Axios.prototype.request = function request(config) {
  // 这个判断针对axios('接口地址url'[,config])这种情况
  if (typeof config === 'string') {
    // 执行axios()把第二个参数设置给config
    config = arguments[1] || {}; 
    // 第一个参数是url
    config.url = arguments[0];
  } else {
    config = config || {};
  }
  // 合并属性
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
  // debugger;
  // Hook up interceptors middleware
  var chain = [dispatchRequest, undefined];
  var promise = Promise.resolve(config);
  // 如果开发代码有调用interceptors里面的use方法，那么就是把拦截器里面的函数添加到handles数组里面，
  // 下面的forEach方法就是遍历handles的代码，分别把代码中use的回调函数添加到chain数组的最前面去，
  // 这里就是为什么拦截器会在真正的请求发送前面执行的原因，因为chain数组到时候会执行是按照顺序执行下去的
  // chain数组结构大概就是[第一个请求拦截成功回调函数, 第一个请求拦截的失败回调函数, 第一个请求函数, undefined, 第一个请求响应成功函数, 第一个请求响应失败函数]
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
```
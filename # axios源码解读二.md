# axios源码解读二

经过上一个篇章的阅读[axios源码解读（上）](https://juejin.cn/post/6986163536233758734)，知道axios本质上就是一个函数，既可以直接调用axios()，又可以当作对象使用axios.get()。接下来对网络请求源码（request）和核心的拦截器（interceptor）进行解读。



## 1. 调用axios发送请求

项目平时引入axios库，直接使用axios(url, config)或者是axios.get(url, config)其实本质上都是调用Axios构造函数上的request方法。

这个方法主要做了下面几件事情：

> 1. 针对不同的axios调用方式，把config配置和默认的defaults配置进行合并，得到新的配置；
>
> 2. 利用promise的链式流把（请求、响应）拦截器和请求按照顺序连接起来；
> 3. 最后把promise对象进行返回；



### 1.1. **第一步：合并配置项**

```js
// 文件位置：lib/core/Axios.js
/**
 * 发送请求方法
 * @param {Object} config 合并defaults属性上的配置作为请求时候的配置
 */
Axios.prototype.request = function request(config) {
  /*第一部分开始*/
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

  if (config.method) {
    config.method = config.method.toLowerCase();
  } else if (this.defaults.method) {
    config.method = this.defaults.method.toLowerCase();
  } else {
    // 默认get请求
    config.method = 'get';
  }
  /*第一部分结束*/
  ...
  
};
```

这里最主要的操作就是把初始化时候的配置defaults属性和开发者调用axios时候传入的config进行合并操作；因为用户既可以axios('url')调用，也可以axios({url: 'xxx'})这样调用，所以才有`typeof config === 'string'`这个判断。



### 1.2. 第二步：请求和拦截器连接

继续看Axios构造函数上的request方法，配置处理合并完成后，就开始对拦截器进行处理，这里有一个数组(请求拦截、ajax请求、响应拦截)，通过promise的链式流调用把他们的顺序连接起来。

```js
Axios.prototype.request = function request(config) {
  ...
  /*第二步开始*/
  // chain数组存储请求和拦截器
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
  /*第二步结束*/
  
};

```

chain数组用来存放本次请求的请求拦截器，ajax请求，响应拦截器相关的成功，失败的函数，请求拦截器相关的函数会插入到chain数组的最前面，响应拦截器。如果没有拦截器，那么默认就是[dispatchRequest, undefined]；那么这个时候就只会发送请求，不做任何拦截。

这里为了方便读者理解，用一个简单的例子来说明：

```js
let chain = [
  function () {console.log('请求拦截器1')},
  function () {console.log('发送请求1')},
  undefined,
  function () {console.log('响应拦截器1')}
];
let chain1 = [
  function () {console.log('请求拦截器2')},
  function () {console.log('发送请求2')},
  undefined,
  function () {console.log('响应拦截器2')}
];
let p = Promise.resolve(1);
let p1 = Promise.resolve(2);
while(chain.length) {
  p = p.then(chain.shift());
}
while(chain1.length) {
  p1 = p1.then(chain1.shift());
}
/**
 结果输出：
 	请求拦截器1
  请求拦截器2
  发送请求1
  发送请求2
  响应拦截器1
  响应拦截器2
 */
```

上面的例子其实和axios源码处理拦截器和请求的处理方式是基本是一样的，通过promise的链式调用控制流程。这个例子中可以看出请求拦截器函数的执行时机是在请求发送之前，响应拦截器的函数时在发送请求之后，符合我们平时的使用。这里的就涉及到事件循环的任务调用顺序问题。


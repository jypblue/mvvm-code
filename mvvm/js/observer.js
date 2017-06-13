
// 监听数据变化并通知订阅者
function Observer(data) {
  this.data = data;
  this.walk(data);
}

Observer.prototype = {
  walk: function(data) {
    var me = this;
    // 类似于for...in循环
    Object.keys(data).forEach(function(key) {
      me.convert(key, data[key]);
    });
  },
  convert: function(key, val) {
    // 传入data对象，key,及对应的value
    this.defineReactive(this.data, key, val);
  },
  defineReactive: function(data, key, val) {
    var dep = new Dep();
    var childObj = observe(val);

    Object.defineProperty(data, key, {
      enumerable: true, // 可枚举
      configurable: false, // 不可改变
      get: function(){
        // 若不为空
        if(Dep.target) {
          dep.depend();
        }
        return val;
      },
      set: function(newVal) {
        if(newVal === val) {
          return;
        }
        val = newVal;
        // 新的值是object的话，进行监听
        childObj = observe(newVal);
        // 通知订阅者
        dep.notify();
      }
    })

  }
}

// Observer实例
function observe(value, vm) {
  if(!value || typeof value !== 'object') {
    return ;
  }
  return new Observer(value);
}

var uid = 0;
// 订阅器
function Dep() {
  this.id = uid++;
  this.subs = [];
}

Dep.prototype = {
  // 添加订阅
  addSub: function(sub) {
    // sub 队列
    this.subs.push(sub);
  },

  depend: function() {
    // ??? watcher.js 方法
    Dep.target.addDep(this);
  },

  // 取消订阅
  removeSub: function(sub) {
    var index = this.subs.indexOf(sub);
    if(index!==-1) {
      this.subs.splice(index,1);
    }
  },


  notify: function() {
    this.subs.forEach(function(sub) {
      // ? watcher.js 数据 watcher.update=> 视图compile.bind方法, 调用订阅者的update方法，通知变化
      sub.update();
    })
  }
};

Dep.target = null;
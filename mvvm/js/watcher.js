function Watcher(vm, expOrFn, cb) {
  this.cb = cb;
  this.vm = vm;
  this.expOrFn = expOrFn;
  this.depIds = {};
  console.log(expOrFn);
  if(typeof expOrFn === 'function') {
    debugger;
    this.getter = expOrFn;
  } else {
    this.getter = this.parseGetter(expOrFn);
  }

  // 此处为了触发属性的getter，从而在dep添加自己，结合Observer更易理解, 更新数据value
  this.value = this.get();
};

Watcher.prototype = {
  update: function(){
    this.run();
  },
  run: function(){
    var value = this.get();
    var oldVal = this.value;
    if(value !== oldVal) {
      this.value = value;
      // 执行Compile中绑定的回调，更新视图
      this.cb.call(this.vm, value, oldVal);
    }
  },
  addDep: function(dep) {
    if(!this.depIds.hasOwnProperty(dep.id)) {
      //observer.js 中的方法， 添加订阅
      dep.addSub(this);
      this.depIds[dep.id] = dep;
    }
  },
  get: function() {
    Dep.target = this;
    var value = this.getter.call(this.vm, this.vm);
    Dep.target = null;
    return value;
  },
  parseGetter: function(exp) {
    if(/[^\w.$]/.test(exp)) return;
    var exps = exp.split('.');

    return function(obj) {
      for(var i = 0, len = exps.length; i< len; i++) {
        if(!obj) return;
        obj = obj[exps[i]];
      }
      return obj;
    }
  }
}
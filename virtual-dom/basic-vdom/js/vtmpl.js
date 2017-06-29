
/**
 * diff from diff.js
 * patch from patch.js
 *
 */
function makeVirtualDOM(){
  // compileFn是传入的函数
  var html = this.compileFn(this.data);
  console.log(html)
  // 返回virtual-dom and dom
  return h2v(html);
}

function setData(data, isSync) {
  _.extend(this.data, data);
  if(typeof isSync === 'boolean' && isSync) {
    this.flush();
  } else if(!this.isDirty) {
    this.isDirty = true;
    var self = this;
    // 缓存所有数据变化，只有重新在浏览器重绘之前更新dom
    _.nextTick(function(){
      self.flush();
    });
  }

  if(typeof isSync === 'function') {
    var callback = isSync;
    this.flushCallbacks.push(callback);
  }

}

function flush() {
  var newVdom = this.makeVirtualDOM().vdom;
  var patches = diff(this.vdom, newVdom);
  patch(this.dom, patches);
  this.vdom = newVdom;
  this.isDirty = false;
  var callbacks = this.flushCallbacks;
  for(var i = 0, len = callbacks.length; i < len; i++) {
    if(callbacks[i]) {
      callbacks[i]();
    }
  }
  this.flushCallbacks = [];
}

function makeTemplateClass(compileFn) {
  function VirtualTemplate(data) {
    this.data = data;
    var domAndVdom = this.makeVirtualDOM();
    this.vdom = domAndVdom.vdom;
    this.dom = domAndVdom.dom;
    this.isDirty = false;
    this.flushCallbacks = [];
  }

  _.extend(VirtualTemplate.prototype, {
    compileFn: compileFn,
    setData: setData,
    makeVirtualDOM: makeVirtualDOM,
    flush: flush
  })

  return VirtualTemplate;
}

function vTemplate(compileFn, data) {
  var VirtualTemplate = makeTemplateClass(compileFn);
  return data ? new VirtualTemplate(data) : VirtualTemplate;
}
// 工具方法
var _ = {};


_.each = function(list, callback) {
  for(var i = 0, len = list.length; i< len; i++) {
    callback(list[i],i);
  }
}


_.extend = function(dest, src) {
  for(var key in src) {
    if(src.hasOwnProperty(key)) {
      dest[key] = src[key];
    }
  }
  return dest;
}


var nextTick =  window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame;

if(nextTick) {
  _.nextTick = function() {
    nextTick.apply(window, arguments);
  }
} else {
  _.nextTick = function(func) {
    setTimeout(func);
  }
}



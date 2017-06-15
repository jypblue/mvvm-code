// 工具函数
var _ = {};

/**
 * 判断对象类型
 */
_.type = function(obj){
  return Object.prototype.toString.call(obj).replace(/\[object\s|\]/g,'');
};

_.isArray = function isArray (list) {
  return _.type(list) === 'Array';
}

//
_.slice = function slice(arrayLike, index) {
  return Array.prototype.slice.call(arrayLike, index);
}

// 转成bool值
_.truthy = function truthy(value) {
  return !!value;
}

_.isString = function isString(list) {
  return _.type(list) === 'String';
}

_.each = function each(array, fn) {
  for(var i = 0, len = array.length; i < len; i++) {
    fn(array[i],i);
  }
}

// 类数组转数组
_.toArray = function toArray(listLike) {
  if(!listLike) return [];
  var list = [];

  for(var i = 0, len = listLike.length; i< len; i++) {
    list.push(listLike[i]);
  }
  return list;
}

// 设置属性
_.setAttr = function setAttr(node, key, value) {
  switch (key) {
    case 'style':
    node.style.cssText = value;
    break;
    case 'value':
    var tagName = node.tagName || '';
    tagName = tagName.toLowerCase();
    if(tagName === 'input' || tagName === 'textarea') {
      node.value = value;
    } else {
      node.setAttribute(key, value);
    }
    break;
    default:
    node.setAttribute(key, value);
    break;
  }
}

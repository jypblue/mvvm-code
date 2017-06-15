
/**
 * @param {String} tagName
 * - Dom tag
 * @param {Object} props
 * - element property
 * - use object to store key-value pair
 * @param {Array} children
 * - element's chilren element
 * - element instance or a text
 */
function Element (tagName, props, children) {
  if(!(this instanceof Element)) {
    if(!_.isArray(children) && children !=null) {
      children = _.slice(arguments, 2).filters(_.truthy);
    }
    // 返回实例
    return new Element(tagName, props, children);
  };

  // 如果是props位置是数组，可能props改变为空，数组是children的内容
  if(_.isArray(props)) {
    children = props;
    props = {};
  }

  this.tagName = tagName;
  this.props = props || {};
  this.children = children || [];
  // void 666 返回undefined => key = undefined
  this.key = props ? props.key : void 666;

  // count 权值？ 做什么？
  var count = 0;

  _.each(this.children, function(child, i) {
    // 判断是否是node元素节点
    if(child instanceof Element) {
      count += child.count;
    } else {
      children[i] = '' + child;
    }
    count ++;
  })

  this.count = count;

}

// 构建元素节点树
// 在Element对象上添加render函数
Element.prototype.render = function() {
  var el = document.createElement(this.tagName);
  var props = this.props;

  for(var propName in props) {
    var propValue = props[propName];
    _.setAttr(el,propName,propValue);
  }

  // 递归调用
  _.each(this.children, function(child) {
    var childEl = (child instanceof Element) ? child.render() : document.createTextNode(child);
    el.appendChild(childEl);
  })
  return el;
}
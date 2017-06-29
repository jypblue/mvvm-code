
var el = Element;

/**
 * 模板转virtal-dom
 *
 * @param {any} html
 * @returns
 */
function h2v(html) {
  var root = document.createElement('div');
  root.innerHTML = html;
  root = (root.childNodes.length === 1) ? root.childNodes[0] : root;
  return {
    vdom: toVirtualDom(root),
    dom: root
  }
}

function toVirtualDom(dom) {
  var tagName = dom.tagName.toLowerCase();
  var props = attrsToObj(dom);
  var children = [];
  for(var i = 0, len = dom.childNodes.length; i < len; i++) {
    var node = dom.childNodes[i];

    // TEXT node
    if(node.nodeType === 3) {
      if(node.nodeValue) {
        children.push(node.nodeValue);
      } else {
        children.push(node.textContent);
      }
    } else {
      children.push(toVirtualDom(node));
    }
  }

  return el(tagName, props, children);
}

function attrsToObj(dom) {
  var attrs = dom.attributes;
  var props = {};
  for(var i = 0, len = attrs.length; i < len; i++) {
    var name = attrs[i].name;
    var value = attrs[i].value;
    if(value && value !== 'null') {
      props[name] = value;
    }
  }
  if(dom.style.cssText) {
    props.style = dom.style.cssText;
  }
  return props;
}

// ?
// if(process.env.NODE_ENV) {
//   h2v.toVirtualDom = toVirtualDom;
// }

/**
 * CodeGen from codegen.js
 * Parser from parser.js
 * svd from js fold all js file
 * _ from util.js;
 */

var vTemplate = {};

vTemplate.compile = function(template) {
  var astRoot = (new Parser(template)).parse();
  var code = new CodeGen(astRoot);

  return function(data) {
    var params = [];
    for(var key in data) {
      params.push('  var ' + key + ' = ' + '_data_.' + key + ';\n')
    }

    var body = params.join('') + code.body;
    // ?why 无法运行
    var renderFunc = new Function('_data_', '_el_', body);
    var el = getElementByRenderFunc(renderFunc, data);
    return new VTemplate(el, data, renderFunc);
  }
}

function VTemplate(el, data, renderFunc) {
  this.oldVd = el;
  this.dom = el.render();
  this.data = data;
  this.renderFunc = renderFunc;
}

var pp = VTemplate.prototype;

pp.setData = function(data, isSync) {
  _.extend(this.data, data);
  if(isSync) {
    this.flush();
  } else {
    var self = this;
    _.nextTick(function() {
      self.flush();
    })
  }
}

pp.flush = function() {
  var newVd = getElementByRenderFunc(this.renderFunc, this.data);
  var patches = diff(this.oldVd, newVd);
  patch(this.dom, patches);
  this.oldVd = newVd;
}

function getElementByRenderFunc(render, data) {
  var container = render(data, Element);
  return (container.children.length === 1) ? container.children[0] : container;
}

// module.exports = vTemplate
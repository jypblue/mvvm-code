/**
 * virtual-template
 * 1. 先把模板编译成一个render函数，函数会根据数据状态返回virtual-dom
 * 2. 用render函数构建virtual-dom;并根据这个virtual-dom构建真正的DOM元素，塞入文档当中
 * 3. 当数据变更的时候，再用render函数渲染一个新的Virtual-DOM
 * 4. 新旧的virtual-Dom进行diff,然后patch已经在文档中的DOM元素
 *
 * 模板引擎本质上就是把一种语言编译成另外一种语言。
 *
 * 编译器步骤：
 * 1. 词法分析： 把输入的模板分割成词法单元（tokens stream）
 * 2. 语法分析：读入tokens stream, 根据文法规则转化成抽象语法树（Abstract Syntax Tree）
 * 3. 代码生成：遍历AST，生成render函数代码
 *
 */

/**
 * CodeGen from codegen.js
 * Parser from parser.js
 * svd from js fold all js file
 * _ from util.js;
 */

var vTemplate = {};
vTemplate.compile = function(template) {
  debugger;
  var astRoot = (new Parser(template)).parse();
  var code = new CodeGen(astRoot);

  return function(data) {
    var params = [];
    for(var key in data) {
      params.push('  var  ' + key + ' = ' + '_data_.' + key + ';\n');
    }
    var body = params.join('') + code.body;
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


var vt = VTemplate.prototype;

vt.setData = function(data, isSync) {
  _.extend(this.data, data);
  if(isSync) {
      this.flush();
  } else {
      var self = this;
      _.nextTick(function(){
        self.flush();
      })
  }
}

vt.flush = function(){
  var newVd = getElementByRenderFunc(this.renderFunc, this.data);
  var patches = diff(this.oldVd, newVd);
  patch(this.dom, patches);
  this.oldVd = newVd;
}

function getElementByRenderFunc(render, data) {
  var container = render(data, Element);
  return (container.children.length === 1)
  ? container.children[0] : container
}
/**
 * 1. 正则扣出要匹配的内容
 * 2. 字符串装入数组
 * 3. 分辨js逻辑部分 ： 逻辑部分和非逻辑部分代码存入数组中再拼装成一个字符串。
 * 4. 编写解析引擎函数
 * 5. 把data数据添加进入代码字符串中
 */

var tplEngine = function(tpl, data) {
  var reg = /<%([^%>]+)?%>/g, // 匹配模板字符串的标记项
  match = null,
  regOut = /(^( )?(if|for|else|switch|case|break|{|})(.*)?)/g, //匹配关键字
  trimReg = /(^\s+)|(\s+$)/g, // 去除空格正则
  code = 'var r = [];\n', // 定义代码字符串数组
  cursor = 0; //定位逻辑与非逻辑的代码片段字符串

  // 存入code数组代码字符串函数
  var add = function(line, js) {
    js ? (code += line.match(regOut) ? line + '\n' : 'r.push(' + line.replace(trimReg, '') + ');\n') :
    (code += line != '' ? 'r.push("' + line.replace(/"/g, '\\"') +'");\n' : '');
    return add;
  }

  // 循环截取模板字符串片段传入数组
  while(match = reg.exec(tpl)) {
    add(tpl.slice(cursor, match.index))(match[1], true);
    cursor = match.index + match[0].length;
  }

  // 截取模板字符串最后一段
  add(tpl.substr(cursor, tpl.length - cursor));

  code += 'return r.join("");';

  // 返回传入数据之后运行的dom代码片段
  return new Function(code.replace(/[\r\t\n]/g, '')).apply(data);
}

var barretTpl = function(str, data) {
  var el = document.getElementById(str);
  if(el) {
    var html = /^(textarea|input)$/.test(el.nodeName) ? el.value : el.innerHTML;
    console.log(html);
    return tplEngine(html, data);
  } else {
    return tplEngine(str, data);
  }
}
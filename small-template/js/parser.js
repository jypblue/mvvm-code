/**
 * Parser
 * 2.语法分析器
 * EBNF 扩展的巴科斯范式
 * LL(1)
 * Tokenizer from tokenizer.js
 * types from tokentypes.js
 *
 */

// 定义类型-字符串描述对应关系
var typesName = {};
typesName[types.TK_TEXT] = "text node";
typesName[types.TK_IF] = "{if}";
typesName[types.TK_END_IF] = "{/if}";
typesName[types.TK_ELSE_IF] = "{elseif ..}";
typesName[types.TK_ELSE] = "{else}";
typesName[types.TK_EACH] = "{each ... }";
typesName[types.TK_END_EACH] = "{/each}";
typesName[types.TK_GT] = ">";
typesName[types.TK_SLASH_GT] = "/>";
typesName[types.TK_TAG_NAME] = "open tag name";
typesName[types.TK_ATTR_NAME] = "attribute name";
typesName[types.TK_ATTR_EQUAL] = "=";
typesName[types.TK_ATTR_STRING] = "attribute string";
typesName[types.TK_CLOSE_TAG] = "close tag";
typesName[types.TK_EOF] = "EOF";

function Parser(input) {
  // 获得词法分析函数实例
  this.tokens = new Tokenizer(input);
}

var psr = Parser.prototype;

// 判断类型是否相等
psr.is = function(type) {
  return (this.tokens.peekToken().type === type);
}



psr.parse = function() {
  this.tokens.index = 0;
  var root = this.parseStat();
  this.eat(types.TK_EOF);
  return root;
}

function pushMembers(target, candidates) {
  for(var i = 0, len = candidates.length; i<len;i++) {
    var lastIndex = target.length - 1;

    if(
      isString(target[lastIndex]) &&
      isString(candidates[i])
    ) {
      target[lastIndex] = candidates[i];
    } else {
      target.push(candidates[i]);
    }
  }
}

function isString(str) {
  return typeof str === 'string';
}

//
psr.parseStat = function() {
  var stat = {
    type: 'Stat',
    members: []
  }

  if(
    this.is(types.TK_IF) ||
    this.is(types.TK_EACH) ||
    this.is(types.TK_TAG_NAME) ||
    this.is(types.TK_TEXT)
  ) {
    pushMembers(stat.members, [this.parseFrag()]);
    pushMembers(stat.members, this.parseStat().members)
  } else {

  }

  return stat;
}

psr.parseFrag = function() {
  if(this.is(types.TK_IF)) {
    return this.parseIfStat();
  } else if(this.is(types.TK_EACH)) {
    return this.parseEachStat();
  } else if(this.is(types.TK_TAG_NAME)){
    return this.parseNode();
  } else if(this.is(types.TK_TEXT)) {
    var token = this.eat(types.TK_TEXT);
    return token.label;
  } else {
    this.parseError('parseFlag');
  }
}

// IfStat -> if stat elseif else '{/if}'

psr.parseIfStat = function() {
  var token = this.tokens.peekToken();
  var ifStat = {
    type: 'IfStat',
    label: token.label // 对应的字符串
  }
  this.eat(types.TK_IF);
  ifStat.body = this.parseStat();
  ifStat.elseifs = this.parseElseIfs();
  ifStat.elseBody = this.parseElse();
  this.eat(types.TK_END_IF);
  return ifStat;
}

// ElseIfs -> ElseIf ElseIfsle
psr.parseElseIfs = function() {
  var elseifs = [];
  if(this.is(types.TK_ELSE_IF)) {
    elseifs.push(this.parseElseIf());
    elseifs.push.apply(
      elseifs,
      this.parseElseIfs()
    )
  } else if(
    this.is(types.TK_ELSE) ||
    this.is(types.TK_END_IF)
  ) {
    // ?
  } else {
    this.parseError('parseElseIfs');
  }
  return elseifs;
}

psr.parseElseIf = function() {
  var token = this.tokens.peekToken();
  var elseif = {
    type: 'ElseIf',
    label: token.label
  }
  this.eat(typesName.TK_ELSE_IF)
  elseif.body = this.parseStat();
  return elseif;
}

psr.parseElse = function() {
  if(this.is(types.TK_ELSE)) {
    this.eat(types.TK_ELSE);
    return this.parseStat();
  } else if(
    this.is(types.TK_END_IF)
  ) {
    // ?
  } else {
    this.parseError('parseElse');
  }
}


psr.parseEachStat = function() {
  var eachStat = {
    type: 'EachStat'
  }

  var token = this.eat(types.TK_EACH);
  eachStat.label = token.label;
  eachStat.body = this.parseStat();
  this.eat(types.TK_END_EACH);
  return eachStat;
}

psr.parseNode = function() {
  var token = this.tokens.peekToken();
  var node = {
    type: 'Node',
    name: token.label
  }
  // 起始
  this.parseOpenTag(node);
  // 结尾
  this.parseNodeTail(node);
  return node;
}

psr.parseOpenTag = function(node){
  this.eat(types.TK_TAG_NAME);
  node.attributes = this.parseAttrs();
}


// '>' '/>' close tag
psr.parseNodeTail = function(node) {
  if(this.is(types.TK_GT)) {
    this.eat(types.TK_GT);
    node.body = this.parseStat();
    this.eat(types.TK_CLOSE_TAG);
  } else if(this.is(types.TK_SLASH_GT)) {
    this.eat(types.TK_SLASH_GT);
  } else {
    this.parseError('parseNodeTail');
  }
}

function extend(src, dest) {
  for(var key in dest) {
    if(dest.hasOwnProperty(key)) {
      src[key] = dest[key];
    }
  }
}
psr.parseAttrs = function() {
  var attrs = {};
  if(this.is(types.TK_ATTR_NAME)) {
    extend(attrs, this.parseAttr());
    extend(attrs, this.parseAttrs())
  } else if(
    this.is(types.TK_GT) ||
    this.is(types.TK_SLASH_GT)
  ){
    // nothing
  } else {
    this.parseError('parseAttrs');
  }
  return attrs;
}

psr.parseAttr = function() {
  var attr = {};
  var token = this.eat(types.TK_ATTR_NAME);
  var value = this.parseValue();
  attr[token.label] = value;
  return attr;
}

psr.parseValue = function() {
  if(
    this.is(types.TK_ATTR_EQUAL)
  ) {
    this.eat(types.TK_ATTR_EQUAL);
    var token = this.eat(types.TK_ATTR_STRING);
    return token.label;
  }
  else if(
    this.is(types.TK_GT) ||
    this.is(types.TK_SLASH_GT) ||
    this.is(types.TK_ATTR_NAME)
   ) {
    //
  } else {
    this.parseError('parseValue');
  }
}

psr.error = function(msg) {
  throw new Error('Parse Error: ' + msg);
}

psr.parseError = function(name) {
  var token = this.tokens.peekToken();
  this.error('in ' + name + ', unexpected token \' ' + token.label +'\'');
}
// 获取对应type的token对象
psr.eat = function(type) {
  var token = this.tokens.nextToken();
  if(token.type !== type) {
    this.error('expect a(n) ' + typesName[type] + ', but got a(n)' + typesName[token.type])
  }
  return token;
}


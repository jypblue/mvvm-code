/**
 * Tokenizer from tokenizer.js
 * types from tokentypes.js
 * Parser
 */

var typesName = {};
typesName[types.TK_TEXT] = 'text node';
typesName[types.TK_IF] = '{if}';
typesName[types.TK_END_IF] = '{/if}';
typesName[types.TK_ELSE_IF] = '{elseif ..}';
typesName[types.TK_ELSE] = '{else}';
typesName[types.TK_EACH] = '{each ... }'
typesName[types.TK_END_EACH] = '{/each}';
typesName[types.TK_GT] = '>';
typesName[types.TK_SLASH_GT] = '/>';
typesName[types.TK_TAG_NAME] = 'open tag name';
typesName[types.TK_ATTR_NAME] = 'attribute name';
typesName[types.TK_ATTR_EQUAL] = '=';
typesName[types.TK_ATTR_STRING] = 'attribute string';
typesName[types.TK_CLOSE_TAG] = 'close tag';
typesName[types.TK_EOF] = 'EOF';

function Parser(input) {
  this.tokens = new Tokenizer(input);
}

var ppt = Parser.prototype;

ppt.is = function(type) {
  return (this.tokens.peekToken().type === type);
}

ppt.parse = function() {
  this.tokens.index = 0;
  var root = this.parseStat();
  this.eat(types.TK_EOF);
  return root;
}

ppt.parseStat = function() {
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
    pushMembers(stat.members, this.parseStat().members);
  } else {

  }
  return stat;
}

/**
 * push stat's member and concat all text
 */

function pushMembers(target, candidates) {
  for(var i = 0, len = candidates.length; i < len; i++) {
    var lasIdx = target.length - 1;
    if(
      isString(target[lasIdx]) &&
      isString(candidates[i])
    ) {
      target[lasIdx] += candidates[i]
    } else {
      target.push(candidates[i]);
    }
  }
}

// 判断类型
function isString(str) {
  return typeof str === 'string';
}

ppt.parseFrag = function() {
  if(this.is(types.TK_IF)) {
    return this.parseIfStat();
  } else if(this.is(types.TK_EACH)) {
    return this.parseEachStat();
  } else if(this.is(types.TK_TAG_NAME)) {
    return this.parseNode();
  } else if(this.is(types.TK_TEXT)) {
    var token = this.eat(types.TK_TEXT);
    return token.label;
  } else {
    this.parseError('parseFrag');
  }
}

ppt.parseIfStat = function() {
  var token = this.tokens.peekToken();
  var ifStat = {
    type: 'IfStat',
    label: token.label
  }

  this.eat(types.TK_IF);

  ifStat.body = this.parseStat();
  ifStat.elseifs = this.parseElseIfs();
  ifStat.elseBody = this.parseElse();
  this.eat(types.TK_END_IF);
  return ifStat;
}

ppt.parseElseIfs = function() {
  var elseifs = [];
  if(this.is(types.TK_ELSE_IF)) {
    elseifs.push(this.parseElseIf());
    elseifs.push.apply(
      elseifs,
      this.parseElseIfs
    )
  } else if(
    this.is(types.TK_ELSE) ||
    this.is(types.TK_END_IF)
  ) {
    // do nothing
  } else {
    this.parseError('parseElseIfs');
  }
  return elseifs;
}


ppt.parseElseIf = function() {
  var token = this.tokens.peekToken();
  var elseif = {
    type: 'ElseIf',
    label: token.label
  }
  this.eat(types.TK_ELSE_IF);
  elseif.body = this.parseStat();
  return elseif;
}

ppt.parseElse = function() {
  if(this.is(types.TK_ELSE)) {
    this.eat(types.TK_ELSE);
    return this.parseStat();
  } else if(
    this.is(types.TK_END_IF)
  ) {
    // DO NOTHING
  } else {
    parseError('parseElse');
  }
}


ppt.parseEachStat = function() {
  var eachStat = {
    type: 'EachStat'
  }
  var token = this.eat(types.TK_EACH);
  eachStat.label = token.label;
  eachStat.body = this.parseStat();
  this.eat(types.TK_END_EACH);
  return eachStat;
}

ppt.parseNode = function() {
  var token = this.tokens.peekToken();
  var node = {
    type: 'Node',
    name: token.label
  }
  this.parseOpenTag(node);
  this.parseNodeTail(node);
  return node;
}

ppt.parseOpenTag = function(node) {
  this.eat(types.TK_TAG_NAME);
  node.attributes = this.parseAttrs();
}

ppt.parseNodeTail = function(node) {
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

ppt.parseAttrs = function() {
  var attrs = [];
  if(this.is(types.TK_ATTR_NAME)) {
    extend(attrs, this.parseAttr());
    extend(attrs, this.parseAttrs());
  } else if(
    this.is(types.TK_GT) ||
    this.is(types.TK_SLASH_GT)
  ) {
    // DO NOTHING
  } else {
    this.parseError('parseAttrs');
  }
  return attrs;
}

ppt.parseAttr = function() {
  var attr = {};
  var token = this.eat(types.TK_ATTR_NAME);
  var value = this.parseValue();
  attr[token.label] = value;
  return attr;
}

ppt.parseValue = function() {
  if(
    this.is(types.TK_ATTR_EQUAL)
  ) {
    this.eat(types.TK_ATTR_EQUAL);
    var token = this.eat(types.TK_ATTR_STRING);
    return token.label;
  } else if(
    this.is(types.TK_GT) ||
    this.is(types.TK_SLASH_GT) ||
    this.is(types.TK_ATTR_NAME)
  ) {
    // ?
  } else {
    this.parseError('parseValue');
  }
}

ppt.error = function(msg) {
  throw new Error('Parse Error: ' + msg);
}

ppt.parseError = function(name) {
  var token = this.tokens.peekToken();
  this.error('in ' + name + ', unexpected token \''+ token.label + '\'');
}

ppt.eat = function(type) {
  var token = this.tokens.nextToken();
  if(token.type !== type) {
    this.error('expect a(n)' + typesName[type] + ', but got a(n)' + typesName[token.type])
  }
  return token;
}

function extend (src, dest) {
  for(var key in dest) {
    if(dest.hasOwnProperty(key)) {
      src[key] = dest[key];
    }
  }
}

// module.exports = Parser;
/**
 * types from tokentypes.js
 *  export Tokenizer
 */

function Tokenizer(input) {
  this.input = input;
  this.index = 0 ;
  this.context = null;
  this.eof = false;
}

var ptype = Tokenizer.prototype;

ptype.nextToken = function() {
  this.eatSpaces();
  return (
    this.readCloseTag() ||
    this.readTagName() ||
    this.readAttrName() ||
    this.readAttrEqual() ||
    this.readAttrString() ||
    this.readGT() ||
    this.readSlashGT() ||
    this.readIF() ||
    this.readElseIf() ||
    this.readElse() ||
    this.readEndIf() ||
    this.readEach() ||
    this.readEndEach() ||
    this.readText() ||
    this.readEOF() ||
    this.error()
  )
}

ptype.peekToken = function() {
  var index = this.index;
  var token = this.nextToken();
  this.index = index;
  return token;
}

/**
 * 一个接一个地读取令牌
 */

ptype.readTagName = function(){
  if(this.char() === '<') {
    this.index++;
    //
    this.eatSpaces();
    var start = this.index;
    // 匹配英文和数字
    while(this.char().match(/[\w\d]/)) {
      this.index++;
    }
    // 返回数组
    var tagName = this.input.slice(start, this.index);
    //
    this.setContext(types.TK_TAG_NAME);
    return {
      type: types.TK_TAG_NAME,
      label: tagName
    }
  }
}

ptype.readAttrName = function() {
  if(this.inContext(types.TK_TAG_NAME) && this.char()) {
    var reg = /[\w\-\d]/;
    // 如果不是英文-数字
    if(!reg.test(this.char())) return;
    var start = this.index;
    while(this.char() && reg.test(this.char())) {
      this.index++;
    }
    return {
      type: types.TK_ATTR_NAME,
      label: this.input.slice(start, this.index)
    }
  }
}

ptype.readAttrEqual = function(){
  if(this.inContext(types.TK_TAG_NAME) && this.char() === '=') {
    this.index++;
    return {
      type: types.TK_ATTR_EQUAL,
      label: '='
    }
  }
}

ptype.readAttrString = function() {
  if(this.inContext(types.TK_TAG_NAME) && /['"]/.test(this.char())) {
    var quote = this.char();
    var start = this.index;
    this.index++;
    while(!isUndefined(this.char()) && this.char() !== quote) {
      this.index++;
    }
    this.index++;
    return {
      type: types.TK_ATTR_STRING,
      label: this.input.slice(start+1, this.index - 1)
    }
  }
}

ptype.readCloseTag = function() {
  return this.captureByRegx(
    /^\<\s*?\/\s*?[\w\d-]+?\s*?\>/,
    types.TK_CLOSE_TAG
  )
}

ptype.readGT = function() {
  if(this.char() === '>') {
    this.index++;
    this.setContext(types.TK_GT);
    return {
      type: types.TK_GT,
      label: '>'
    }
  }
}

ptype.readSlashGT = function() {
  return this.captureByRegx(
    /^\/\>/,
    types.TK_SLASH_GT
  )
}

ptype.readIF = function() {
  return this.captureByRegx(
    /^\{\s*?if\s[\S\s]*?\}/,
    types.TK_IF
  )
}

ptype.readElse = function() {
  return this.captureByRegx(
    /^\{\s*else\s*\}/,
    types.TK_ELSE
  )
}

ptype.readElseIf = function() {
  return this.captureByRegx(
    /^\{\s*elseif\s*[\S\s]+?\}/,
    types.TK_ELSE_IF
  )
}

ptype.readEndIf = function() {
  return this.captureByRegx(
    /^\{\s*\/if\s*\}/,
    types.TK_END_IF
  )
}

ptype.readEach = function() {
  return this.captureByRegx(
    /^\{\s*each\s*[\S\s]*?\}/,
    types.TK_EACH
  )
}


ptype.readEndEach = function() {
  return this.captureByRegx(
    /^\{\s*\/each\s*\}/,
    types.TK_END_EACH
  )
}

ptype.readText = function() {
  if(!this.inContext(types.TK_TAG_NAME)) {
    var start = this.index;
    if(!this.char())return;
    this.index++;
    while(
      this.char() && !(/[\<\{]/.test(this.char()))
    ) {
      this.index++;
    }
    return {
      type: types.TK_TEXT,
      label: this.input.slice(start, this.index)
    }
  }
}


ptype.readEOF = function() {
  if(this.index >= this.input.length) {
    this.eof = true;
    return {
      type: types.TK_EOF,
      label: '$'
    }
  }
}


/**
 * 帮助函数
 */

ptype.eatSpaces = function() {
  while(/\s/.test(this.char())) {
    this.index++;
  }
}

ptype.setContext = function(type) {
  this.context = type;
}

ptype.inContext = function(type) {
  return this.context === type;
}

ptype.char = function() {
  return this.input[this.index];
}

ptype.captureByRegx = function(regx, type) {
  var input = this.input.slice(this.index);
  var capture = input.match(regx);
  if(capture) {
    capture = capture[0];
    this.index += capture.length;
    this.setContext(type);
    return {
      type: type,
      label: capture
    }
  }
}

ptype.test = function() {
  while(!this.eof) {
    console.log(this.nextToken());
  }
}

ptype.error = function() {
  throw new Error('Unexpected token: \''+ this.char() + '\'');
}

function isUndefined(value) {
  return value === void 666;
}


//module.exports = Tokenizer;
/**
 * Tokenizer
 * 1.词法分析器
 * 把输入的模板字符串从左到右进行扫描，按照上面的 token 的类型进行分割。
 * Tokenizer 会存储一个 index，标记当前识别到哪个字符位置。每次调用 nextToken 会先跳过所有的空白字符，然后尝试某一种类型的 token ，识别失败就会尝试下一种，如果成功就直接返回，并且把 index 往前移；所有类型都试过都无法识别那么就是语法错误，直接抛出异常。
 * types from tokentypes.js
 *  export Tokenizer
 */

function Tokenizer (input) {
  this.input = input
  this.index = 0
  this.context = null
  this.eof = false
}

var tkz = Tokenizer.prototype

tkz.nextToken = function () {
  this.eatSpaces()
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

tkz.peekToken = function () {
  var index = this.index
  var token = this.nextToken()
  this.index = index
  return token
}

/*
 * Read token one by one
 */

tkz.readTagName = function () {
  if (this.char() === '<') {
    this.index++
    this.eatSpaces()
    var start = this.index
    while (this.char().match(/[\w\d]/)) {
      this.index++
    }
    var tagName = this.input.slice(start, this.index)
    this.setContext(types.TK_TAG_NAME)
    return {
      type: types.TK_TAG_NAME,
      label: tagName
    }
  }
}

tkz.readAttrName = function () {
  if (this.inContext(types.TK_TAG_NAME) && this.char()) {
    var reg = /[\w\-\d]/
    if (!reg.test(this.char())) return
    var start = this.index
    while (this.char() && reg.test(this.char())) {
      this.index++
    }
    return {
      type: types.TK_ATTR_NAME,
      label: this.input.slice(start, this.index)
    }
  }
}

tkz.readAttrEqual = function () {
  if (this.inContext(types.TK_TAG_NAME) && this.char() === '=') {
    this.index++
    return {
      type: types.TK_ATTR_EQUAL,
      label: '='
    }
  }
}

tkz.readAttrString = function () {
  if (this.inContext(types.TK_TAG_NAME) && /['"]/.test(this.char())) {
    var quote = this.char()
    var start = this.index
    this.index++
    while (!isUndefined(this.char()) && this.char() !== quote) {
      this.index++
    }
    this.index++
    return {
      type: types.TK_ATTR_STRING,
      label: this.input.slice(start + 1, this.index - 1)
    }
  }
}

tkz.readCloseTag = function () {
  return this.captureByRegx(
    /^\<\s*?\/\s*?[\w\d-]+?\s*?\>/,
    types.TK_CLOSE_TAG
  )
}

tkz.readGT = function () {
  if (this.char() === '>') {
    this.index++
    this.setContext(types.TK_GT)
    return {
      type: types.TK_GT,
      label: '>'
    }
  }
}

tkz.readSlashGT = function () {
  return this.captureByRegx(
    /^\/\>/,
    types.TK_SLASH_GT
  )
}

tkz.readIF = function () {
  return this.captureByRegx(
    /^\{\s*?if\s[\S\s]*?\}/,
    types.TK_IF
  )
}

tkz.readElse = function () {
  return this.captureByRegx(
    /^\{\s*else\s*\}/,
    types.TK_ELSE
  )
}

tkz.readElseIf = function () {
  return this.captureByRegx(
    /^\{\s*elseif\s*[\S\s]+?\}/,
    types.TK_ELSE_IF
  )
}

tkz.readEndIf = function () {
  return this.captureByRegx(
    /^\{\s*\/if\s*\}/,
    types.TK_END_IF
  )
}

tkz.readEach = function () {
  return this.captureByRegx(
    /^\{\s*each\s*[\S\s]*?\}/,
    types.TK_EACH
  )
}

tkz.readEndEach = function () {
  return this.captureByRegx(
    /^\{\s*\/each\s*\}/,
    types.TK_END_EACH
  )
}

tkz.readText = function () {
  if (!this.inContext(types.TK_TAG_NAME)) {
    var start = this.index
    if (!this.char()) return
    this.index++
    while (
      this.char() && !(/[\<\{]/.test(this.char()))
    ) {
      this.index++
    }
    return {
      type: types.TK_TEXT,
      label: this.input.slice(start, this.index)
    }
  }
}

tkz.readEOF = function () {
  if (this.index >= this.input.length) {
    this.eof = true
    return {
      type: types.TK_EOF,
      label: '$'
    }
  }
}

/*
 * Helpers Functions
 */

tkz.eatSpaces = function () {
  while (/\s/.test(this.char())) {
    this.index++
  }
}

tkz.setContext = function (type) {
  this.context = type
}

tkz.inContext = function (type) {
  return this.context === type
}

tkz.char = function () {
  return this.input[this.index]
}

tkz.captureByRegx = function (regx, type) {
  var input = this.input.slice(this.index)
  var capture = input.match(regx)
  if (capture) {
    capture = capture[0]
    this.index += capture.length
    this.setContext(type)
    return {
      type: type,
      label: capture
    }
  }
}

tkz.test = function () {
  while(!this.eof) {
    console.log(this.nextToken())
  }
}

tkz.error = function () {
  throw new Error('Unexpected token: \'' + this.char() + '\'')
}

function isUndefined (value) {
  return value === void 666
}




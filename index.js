var stream = require('stream')
var inherits = require('inherits')
var genobj = require('generate-object-property')
var genfun = require('generate-function')

var quote = new Buffer('"')[0]
var comma = new Buffer(',')[0]
var cr = new Buffer('\r')[0]
var nl = new Buffer('\n')[0]

var Parser = function (opts) {
  if (!opts) opts = {}
  if (Array.isArray(opts)) opts = {headers: opts}

  stream.Transform.call(this, {objectMode: true, highWaterMark: 16})

  this.separator = opts.separator ? new Buffer(opts.separator)[0] : comma
  this.quote = opts.quote ? new Buffer(opts.quote)[0] : quote
  this.escape = opts.escape ? new Buffer(opts.escape)[0] : this.quote
  if (opts.newline) {
    this.newline = new Buffer(opts.newline)[0]
    this.customNewline = true
  } else {
    this.newline = nl
    this.customNewline = false
  }

  this.headers = opts.headers || null
  this.strict = opts.strict || null

  this._raw = !!opts.raw
  this._prev = null
  this._prevEnd = 0
  this._first = true
  this._empty = this._raw ? new Buffer(0) : ''
  this._Row = null

  if (this.headers) {
    this._first = false
    this._compile(this.headers)
  }
}

inherits(Parser, stream.Transform)

Parser.prototype._transform = function (data, enc, cb) {
  if (typeof data === 'string') data = new Buffer(data)

  var start = 0
  var buf = data
  var quotedCell = false

  if (this._prev) {
    start = this._prev.length
    buf = Buffer.concat([this._prev, data])
    this._prev = null
  }

  for (var i = start; i < buf.length; i++) {
    // non-escaped quote (quoting the cell)
    if (buf[i] === this.quote && (i === start || (i > start && buf[i - 1] !== this.escape))) {
      quotedCell = !quotedCell
      continue
    }

    if (!quotedCell) {
      if (this._first && !this.customNewline) {
        if (buf[i] === nl) {
          this.newline = nl
        } else if (buf[i] === cr) {
          if (buf[i + 1] !== nl) {
            this.newline = cr
          }
        }
      }

      if (buf[i] === this.newline) {
        this._online(buf, this._prevEnd, i + 1)
        this._prevEnd = i + 1
      }
    }
  }

  if (this._prevEnd === buf.length) {
    this._prevEnd = 0
    return cb()
  }

  if (buf.length - this._prevEnd < data.length) {
    this._prev = data
    this._prevEnd -= (buf.length - data.length)
    return cb()
  }

  this._prev = buf
  cb()
}

Parser.prototype._flush = function (cb) {
  if (this._escaped || !this._prev) return cb()
  this._online(this._prev, this._prevEnd, this._prev.length + 1) // plus since online -1s
  cb()
}

Parser.prototype._online = function (buf, start, end) {
  end-- // trim newline
  if (!this.customNewline && buf.length && buf[end - 1] === cr) end--

  var comma = this.separator
  var cells = []
  var isQuoted = false
  var offset = start

  for (var i = start; i < end; i++) {
    var isStartingQuote = !isQuoted && buf[i] === this.quote
    var isEndingQuote = isQuoted && buf[i] === this.quote && i + 1 <= end && buf[i + 1] === comma
    var isEscape = isQuoted && buf[i] === this.escape && i + 1 < end && buf[i + 1] === this.quote

    if (isStartingQuote || isEndingQuote) {
      isQuoted = !isQuoted
      continue
    } else if (isEscape) {
      i++
      continue
    }

    if (buf[i] === comma && !isQuoted) {
      cells.push(this._oncell(buf, offset, i))
      offset = i + 1
    }
  }

  if (offset < end) cells.push(this._oncell(buf, offset, end))
  if (buf[end - 1] === comma) cells.push(this._empty)

  if (this._first) {
    this._first = false
    this.headers = cells
    this._compile(cells)
    this.emit('headers', this.headers)
    return
  }

  if (this.strict && cells.length !== this.headers.length) {
    this.emit('error', new Error('Row length does not match headers'))
  } else {
    this._emit(this._Row, cells)
  }
}

Parser.prototype._compile = function () {
  if (this._Row) return

  var Row = genfun()('function Row (cells) {')

  this.headers.forEach(function (cell, i) {
    Row('%s = cells[%d]', genobj('this', cell), i)
  })

  Row('}')

  this._Row = Row.toFunction()

  if (Object.defineProperty) {
    Object.defineProperty(this._Row.prototype, 'headers', {
      enumerable: false,
      value: this.headers
    })
  } else {
    this._Row.prototype.headers = this.headers
  }
}

Parser.prototype._emit = function (Row, cells) {
  this.push(new Row(cells))
}

Parser.prototype._oncell = function (buf, start, end) {
  // remove quotes from quoted cells
  if (buf[start] === this.quote && buf[end - 1] === this.quote) {
    start++
    end--
  }

  for (var i = start, y = start; i < end; i++) {
    // check for escape characters and skip them
    if (buf[i] === this.escape && i + 1 < end && buf[i + 1] === this.quote) i++
    if (y !== i) buf[y] = buf[i]
    y++
  }

  return this._onvalue(buf, start, y)
}

Parser.prototype._onvalue = function (buf, start, end) {
  if (this._raw) return buf.slice(start, end)
  return buf.toString('utf-8', start, end)
}

module.exports = function (opts) {
  return new Parser(opts)
}

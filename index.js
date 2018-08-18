const stream = require('stream')
const inherits = require('inherits')
const genobj = require('generate-object-property')
const genfun = require('generate-function')
const bufferFrom = require('buffer-from')
const bufferAlloc = require('buffer-alloc')

const [quote] = bufferFrom('"')
const [comma] = bufferFrom(',')
const [cr] = bufferFrom('\r')
const [nl] = bufferFrom('\n')

const Parser = function (opts) {
  if (!opts) opts = {}
  if (Array.isArray(opts)) opts = {headers: opts}

  stream.Transform.call(this, {objectMode: true, highWaterMark: 16})

  this.separator = opts.separator ? bufferFrom(opts.separator)[0] : comma
  this.quote = opts.quote ? bufferFrom(opts.quote)[0] : quote
  this.escape = opts.escape ? bufferFrom(opts.escape)[0] : this.quote
  if (opts.newline) {
    ([this.newline] = bufferFrom(opts.newline))
    this.customNewline = true
  } else {
    this.newline = nl
    this.customNewline = false
  }

  this.headers = opts.headers || null
  this.strict = opts.strict || null
  this.mapHeaders = opts.mapHeaders || identity
  this.mapValues = opts.mapValues || identity
  this.skipUntil = opts.skipUntil || null

  this._raw = !!opts.raw
  this._prev = null
  this._prevEnd = 0
  this._first = true
  this._quoted = false
  this._escaped = false
  this._empty = this._raw ? bufferAlloc(0) : ''
  this._Row = null
  this._line = 1

  if (this.headers) {
    this._first = false
    this._compile(this.headers)
  }
}

inherits(Parser, stream.Transform)

Parser.prototype._transform = function (data, enc, cb) {
  if (typeof data === 'string') data = bufferFrom(data)

  let start = 0
  let buf = data

  if (this._prev) {
    start = this._prev.length
    buf = Buffer.concat([this._prev, data])
    this._prev = null
  }

  const bufLen = buf.length

  for (let i = start; i < bufLen; i++) {
    const chr = buf[i]
    const nextChr = i + 1 < bufLen ? buf[i + 1] : null

    if (!this._escaped && chr === this.escape && nextChr === this.quote && i !== start) {
      this._escaped = true
      continue
    } else if (chr === this.quote) {
      if (this._escaped) {
        this._escaped = false
      // non-escaped quote (quoting the cell)
      } else {
        this._quoted = !this._quoted
      }
      continue
    }

    if (!this._quoted) {
      if (this._first && !this.customNewline) {
        if (chr === nl) {
          this.newline = nl
        } else if (chr === cr) {
          if (nextChr !== nl) {
            this.newline = cr
          }
        }
      }

      if (chr === this.newline) {
        this._online(buf, this._prevEnd, i + 1)
        this._prevEnd = i + 1
      }
    }
  }

  if (this._prevEnd === bufLen) {
    this._prevEnd = 0
    return cb()
  }

  if (bufLen - this._prevEnd < data.length) {
    this._prev = data
    this._prevEnd -= (bufLen - data.length)
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

  const comma = this.separator
  const cells = []
  let isQuoted = false
  let offset = start

  for (let i = start; i < end; i++) {
    const isStartingQuote = !isQuoted && buf[i] === this.quote
    const isEndingQuote = isQuoted && buf[i] === this.quote && i + 1 <= end && buf[i + 1] === comma
    const isEscape = isQuoted && buf[i] === this.escape && i + 1 < end && buf[i + 1] === this.quote

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

  var skip = this.skipUntil && this.skipUntil !== this._line
  this._line++

  if (this._first && !skip) {
    this._first = false
    this.headers = cells
    this._compile(cells)
    this.emit('headers', this.headers)
    return
  }

  if (this.strict && cells.length !== this.headers.length) {
    const e = new RangeError('Row length does not match headers')
    this.emit('error', e)
  } else {
    if (!this._first) this._emit(this._Row, cells)
  }
}

Parser.prototype._compile = function () {
  if (this._Row) return

  const Row = genfun()('function Row (cells) {')

  const self = this
  this.headers.forEach((cell, i) => {
    const newHeader = self.mapHeaders(cell, i)
    if (newHeader) {
      Row('%s = cells[%d]', genobj('this', newHeader), i)
    }
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

  let y = start

  for (let i = start; i < end; i++) {
    // check for escape characters and skip them
    if (buf[i] === this.escape && i + 1 < end && buf[i + 1] === this.quote) i++
    if (y !== i) buf[y] = buf[i]
    y++
  }

  const value = this._onvalue(buf, start, y)
  return this._first ? value : this.mapValues(value)
}

Parser.prototype._onvalue = function (buf, start, end) {
  if (this._raw) return buf.slice(start, end)
  return buf.toString('utf-8', start, end)
}

function identity (id) {
  return id
}

module.exports = function (opts) {
  return new Parser(opts)
}

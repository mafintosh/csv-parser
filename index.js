const { Transform } = require('stream')
const genobj = require('generate-object-property')
const genfun = require('generate-function')
const bufferFrom = require('buffer-from')
const bufferAlloc = require('buffer-alloc')

const [cr] = bufferFrom('\r')
const [nl] = bufferFrom('\n')
const identity = (id) => id
const defaults = {
  escape: '"',
  headers: null,
  mapHeaders: identity,
  mapValues: identity,
  newline: '\n',
  quote: '"',
  raw: false,
  separator: ',',
  strict: false
}

class CsvParser extends Transform {
  constructor (opts = {}) {
    super({ objectMode: true, highWaterMark: 16 })

    if (Array.isArray(opts)) opts = { headers: opts }

    const options = Object.assign({}, defaults, opts)

    this.customNewline = options.newline !== defaults.newline

    for (const key of Object.keys(options)) {
      if (['newline', 'quote', 'separator'].includes(key)) {
        ([options[key]] = bufferFrom(options[key]))
      }
      // legacy codebase support
      this[key] = options[key]
    }

    // if escape is not defined on the passed options, use the end value of quote
    this.escape = (opts || {}).escape ? bufferFrom(options.escape)[0] : options.quote
    this._prev = null
    this._prevEnd = 0
    this._first = true
    this._quoted = false
    this._escaped = false
    this._empty = this._raw ? bufferAlloc(0) : ''
    this._Row = null

    if (this.headers) {
      this._first = false
      this._compile(this.headers)
    }
  }

  _compile () {
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

  _emit (Row, cells) {
    this.push(new Row(cells))
  }

  _flush (cb) {
    if (this._escaped || !this._prev) return cb()
    this._online(this._prev, this._prevEnd, this._prev.length + 1) // plus since online -1s
    cb()
  }

  _oncell (buf, start, end) {
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

  _online (buf, start, end) {
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

    if (this._first) {
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
      this._emit(this._Row, cells)
    }
  }

  _onvalue (buf, start, end) {
    if (this._raw) return buf.slice(start, end)
    return buf.toString('utf-8', start, end)
  }

  _transform (data, enc, cb) {
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
}

module.exports = (opts) => new CsvParser(opts)

var parse = require('../')
var asBuffer = require('as-buffer')
var Readable = require('stream').Readable

module.exports = function CSVParser (_stream, opts) {
  var stream = _stream
  if (typeof _stream === 'string') {
    stream = new Readable()
    stream._read = function () { }
    stream.push(_stream)
    stream.push(null) // end
  }
  return asBuffer(stream.pipe(parse(opts)))
}

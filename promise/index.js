var parse = require('../')
var asBuffer = require('as-buffer')

module.exports = function CSVParser (stream, opts) {
  return asBuffer(stream.pipe(parse(opts)))
}

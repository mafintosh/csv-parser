var write = require('csv-write-stream')
var through = require('through2')
var parse = require('../')
var path = require('path')
var fs = require('fs')

// Read a file, transform it and send it
// to stdout. Optionally could also write
// to a file instead of stdout with:
// .pipe(fs.createWriteStream('./file'))
fs.createReadStream(path.join(__dirname, '../test/data/dummy.csv'))
  .pipe(parse())
  .pipe(through.obj(transform))
  .pipe(write())
  .pipe(process.stdout)

// Prepend all chunks with `value: `.
// @param {Object} chunk
// @param {String} encoding
// @param {Function} callback
function transform (chunk, enc, cb) {
  Object.keys(chunk).forEach(function (k) {
    chunk[k] = 'value: ' + chunk[k]
  })
  this.push(chunk)
  cb()
}

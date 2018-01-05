var parse = require('../')
var path = require('path')
var fs = require('fs')
var {Transform} = require('stream')

class Stringify extends Transform {
  _transform(data, encoding, callback) {
    callback(null, JSON.stringify(data))
  }
}

// Read a file, transform it and send it
// to stdout. Optionally could also write
// to a file instead of stdout with:
// .pipe(fs.createWriteStream('./file'))
fs.createReadStream(path.join(__dirname, '../test/data/dummy.csv'))
  .pipe(parse())
  .pipe(new Stringify({objectMode: true}))
  .pipe(process.stdout)

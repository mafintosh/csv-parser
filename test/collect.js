var fs = require('fs')
var path = require('path')
var csv = require('..')

module.exports = function collect(name, opts, cb) {
  if (typeof opts === 'function') return collect(name, null, opts)

  var data = fs.createReadStream(path.join(__dirname, 'data', name))
  var lines = []
  var parser = csv(opts)
  data.pipe(parser)
    .on('data', function (line) {
      lines.push(line)
    })
    .on('error', function (err) { cb(err, lines) })
    .on('end', function () { cb(false, lines) })
  return parser
}

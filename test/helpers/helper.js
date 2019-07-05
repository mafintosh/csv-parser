const fs = require('fs')
const path = require('path')

const csv = require('../..')

const read = fs.createReadStream

// helpers
function fixture (name) {
  return path.join(__dirname, '../fixtures', name)
}

function collect (file, opts, cb) {
  if (typeof opts === 'function') {
    return collect(file, null, opts)
  }
  const data = read(fixture(`${file}.csv`))
  const lines = []
  const parser = csv(opts)
  data
    .pipe(parser)
    .on('data', (line) => {
      lines.push(line)
    })
    .on('error', (err) => {
      cb(err, lines)
    })
    .on('end', () => {
      // eslint-disable-next-line standard/no-callback-literal
      cb(false, lines)
    })
  return parser
}

module.exports = { collect, fixture }

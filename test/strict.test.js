const test = require('ava')

const { collect } = require('./helpers/helper')

test.cb('strict', (t) => {
  const verify = (err, lines) => {
    t.is(err.name, 'RangeError', 'err name')
    t.is(err.message, 'Row length does not match headers', 'strict row length')
    t.snapshot(lines[0], 'first row')
    t.snapshot(lines[1], 'second row')
    t.is(lines.length, 2, '2 rows before error')
    t.end()
  }

  collect('strict', { strict: true }, verify)
})

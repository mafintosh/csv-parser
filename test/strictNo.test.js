const test = require('ava')

const { collect } = require('./helpers/helper')

test.cb('strictNo', (t) => {
  const verify = (err, lines) => {
    const headersFirstLine = Object.keys(lines[0])
    const headersLastLine = Object.keys(lines[2])
    t.deepEqual(headersFirstLine, headersLastLine)
    t.false(err, 'no err')
    t.snapshot(lines[0], 'first row')
    t.snapshot(lines[1], 'broken row')
    t.snapshot(lines[2], 'last row')
    t.is(lines.length, 3, '3 rows')
    t.end()
  }

  collect('strict-false-broken', { strict: false }, verify)
})

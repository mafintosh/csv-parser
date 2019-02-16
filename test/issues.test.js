const test = require('ava')

const { collect } = require('./helpers/helper')

test.cb('backtick separator (#105)', (t) => {
  const verify = (err, lines) => {
    t.false(err, 'no err')
    t.snapshot(lines, 'lines')
    t.is(lines.length, 2, '2 rows')
    t.end()
  }

  collect('backtick.csv', { separator: '`' }, verify)
})

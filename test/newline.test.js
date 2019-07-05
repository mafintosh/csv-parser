const test = require('ava')

const { collect } = require('./helpers/helper')

test.cb('newline', (t) => {
  const verify = (err, lines) => {
    t.false(err, 'no err')
    t.snapshot(lines[0], 'first row')
    t.snapshot(lines[1], 'second row')
    t.snapshot(lines[2], 'third row')
    t.is(lines.length, 3, '3 rows')
    t.end()
  }

  collect('option-newline', { newline: 'X' }, verify)
})

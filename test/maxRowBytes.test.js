const test = require('ava')

const { collect } = require('./helpers/helper')

test.cb('optional row size limit', (t) => {
  const verify = (err, lines) => {
    t.is(err.message, 'Row exceeds the maximum size', 'strict row size')
    t.is(lines.length, 4576, '4576 rows before error')
    t.end()
  }

  collect('max_row_size.csv', { maxRowBytes: 200 }, verify)
})

const test = require('ava')

const { collect } = require('./helpers/helper')

test.cb('extended range error', (t) => {
  const verify = (err, lines) => {
    t.is(err.lineNumber, 2, 'lineNumber set')
    t.is(err.cells.length, 1, 'cells returned')
    t.is(err.line, '1', 'line returned')
    t.end()
  }

  collect('option-extendedRangeError', { columns: true, strict: true, extendedRangeError: true }, verify)
})

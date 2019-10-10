const test = require('ava')

const { collect } = require('./helpers/helper')

test.cb('strict: false - more columns', (t) => {
  const verify = (err, lines) => {
    const headersFirstLine = Object.keys(lines[0])
    const headersBrokenLine = Object.keys(lines[1])
    const headersLastLine = Object.keys(lines[2])
    t.false(err, 'no err')
    t.is(headersBrokenLine[0], '0', 'first column name is 0')
    t.deepEqual(headersFirstLine, headersLastLine)
    t.snapshot(lines[0], 'first row')
    t.snapshot(lines[1], 'broken row')
    t.snapshot(lines[2], 'last row')
    t.is(lines.length, 3, '3 rows')
    t.is(headersBrokenLine.length, 4, '4 columns')
    t.end()
  }

  collect('strict-false-more-columns', { strict: false }, verify)
})

test.cb('strict: false - less columns', (t) => {
  const verify = (err, lines) => {
    const headersFirstLine = Object.keys(lines[0])
    const headersBrokenLine = Object.keys(lines[1])
    const headersLastLine = Object.keys(lines[2])
    t.false(err, 'no err')
    t.is(headersBrokenLine[0], '0', 'first column name is "0"')
    t.deepEqual(headersFirstLine, headersLastLine)
    t.snapshot(lines[0], 'first row')
    t.snapshot(lines[1], 'broken row')
    t.snapshot(lines[2], 'last row')
    t.is(lines.length, 3, '3 rows')
    t.is(headersBrokenLine.length, 2, '2 columns')
    t.end()
  }

  collect('strict-false-less-columns', { strict: false }, verify)
})

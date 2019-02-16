const test = require('ava')

const { collect } = require('./helpers/helper')

test.cb('map values', (t) => {
  const headers = []
  const indexes = []
  const mapValues = ({ header, index, value }) => {
    headers.push(header)
    indexes.push(index)
    return parseInt(value, 10)
  }

  const verify = (err, lines) => {
    t.false(err, 'no err')
    t.snapshot(lines[0], 'first row')
    t.is(lines.length, 1, '1 row')
    t.snapshot(headers, 'headers')
    t.snapshot(indexes, 'indexes')
    t.end()
  }

  collect('dummy.csv', { mapValues }, verify)
})

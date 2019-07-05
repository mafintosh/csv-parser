const test = require('ava')

const { collect } = require('./helpers/helper')

test.cb('rename columns', (t) => {
  const headers = { a: 'x', b: 'y', c: 'z' }
  const mapHeaders = ({ header, index }) => {
    return headers[header]
  }
  const verify = (err, lines) => {
    t.false(err, 'no err')
    t.snapshot(lines[0], 'first row')
    t.is(lines.length, 1, '1 row')
    t.end()
  }

  collect('basic', { mapHeaders }, verify)
})

test.cb('skip columns a and c', (t) => {
  const mapHeaders = ({ header, index }) => {
    if (['a', 'c'].indexOf(header) > -1) {
      return null
    }
    return header
  }

  const verify = (err, lines) => {
    t.false(err, 'no err')
    t.snapshot(lines[0], 'first row')
    t.is(lines.length, 1, '1 row')
    t.end()
  }

  collect('basic', { mapHeaders }, verify)
})

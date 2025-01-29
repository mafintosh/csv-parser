const test = require('ava')
const bops = require('bops')
const csv = require('..')

const { collect } = require('./helpers/helper')

test.cb('simple csv with byte offset', (t) => {
  const verify = (err, lines) => {
    t.false(err, 'no err')
    t.snapshot(lines[0], 'first row')
    t.is(lines.length, 1, '1 row')
    t.end()
  }

  collect('basic', { outputByteOffset: true }, verify)
})

test.cb('large dataset with byte offset', (t) => {
  const verify = (err, lines) => {
    t.false(err, 'no err')
    t.snapshot(lines[0], 'first row')
    t.snapshot(lines[1], 'second row')
    t.is(lines.length, 7268, '7268 rows')
    t.end()
  }

  collect('large-dataset', { outputByteOffset: true }, verify)
})

test.cb('multibyte character set with byte offset', (t) => {
  const headers = bops.from('a\n')
  const cell1 = bops.from('this ʤ is multibyte1\n')
  const cell2 = bops.from('this ʤ is multibyte2\n')
  const expected1 = 'this ʤ is multibyte1'
  const expected2 = 'this ʤ is multibyte2'
  const parser = csv({ outputByteOffset: true })

  parser.write(headers)
  parser.write(cell1)
  parser.write(cell2)
  parser.end()

  const lines = []
  parser.on('data', (data) => {
    lines.push(data)
  })
  parser.on('end', () => {
    t.is(lines.length, 2, '2 rows')
    t.is(lines[0].row.a, expected1, 'multibyte character is preserved')
    t.is(lines[0].byteOffset, 2, 'byte offset is correct')
    t.is(lines[1].row.a, expected2, 'multibyte character is preserved')
    t.is(lines[1].byteOffset, 24, 'byte offset is correct')
    t.end()
  })
})

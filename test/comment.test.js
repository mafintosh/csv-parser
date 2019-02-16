const test = require('ava')

const { collect } = require('./helpers/helper')

test.cb('comment', (t) => {
  const verify = (err, lines) => {
    t.false(err, 'no err')
    t.snapshot(lines)
    t.is(lines.length, 2, '2 rowa')
    t.end()
  }

  collect('comment.csv', { skipComments: true }, verify)
})

test.cb('custom comment', (t) => {
  const verify = (err, lines) => {
    t.false(err, 'no err')
    t.snapshot(lines)
    t.is(lines.length, 2, '2 rows')
    t.end()
  }

  collect('custom-comment.csv', { skipComments: '~' }, verify)
})

const test = require('ava')

const { collect } = require('./helpers/helper')

test.cb('custom quote character', (t) => {
  const verify = (err, lines) => {
    t.false(err, 'no err')
    t.snapshot(lines[0], 'first row')
    t.snapshot(lines[1], 'second row')
    t.is(lines.length, 2, '2 rows')
    t.end()
  }

  collect('custom_quote_character.csv', { quote: "'" }, verify)
})

test.cb('custom quote and escape character', (t) => {
  const verify = (err, lines) => {
    t.false(err, 'no err')
    t.snapshot(lines[0], 'first row')
    t.snapshot(lines[1], 'second row')
    t.snapshot(lines[2], 'third row')
    t.is(lines.length, 3, '3 rows')
    t.end()
  }

  collect('custom_quote_and_escape_character.csv', { quote: "'", escape: '\\' }, verify)
})

test.cb('custom quote character with default escaped value', (t) => {
  const verify = (err, lines) => {
    t.false(err, 'no err')
    t.snapshot(lines[0], 'first row')
    t.snapshot(lines[1], 'second row')
    t.snapshot(lines[2], 'third row')
    t.is(lines.length, 3, '3 rows')
    t.end()
  }

  collect('custom_quote_character_default_escape.csv', { quote: "'" }, verify)
})

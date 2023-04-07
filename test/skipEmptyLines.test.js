const test = require('ava')

const { collect } = require('./helpers/helper')

test.cb('skip empty lines', (t) => {
  const verify = (err, lines) => {
    console.log(lines)
    t.false(err, 'no err')
    t.is(lines.length, 3, '3 row')
    t.is(JSON.stringify(lines[0]), JSON.stringify({ A: '1' }))
    t.is(JSON.stringify(lines[1]), JSON.stringify({ A: '2' }))
    t.is(JSON.stringify(lines[2]), JSON.stringify({ A: '3' }))
    t.end()
  }

  collect('option-skipEmptyLines', { skipEmptyLines: true, columns: true, strict: true }, verify)
})

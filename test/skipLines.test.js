const test = require('ava')

const { collect } = require('./helpers/helper')

test.cb('skip rows until', (t) => {
  const verify = (err, lines) => {
    t.false(err, 'no err')
    t.is(JSON.stringify(lines[0]), JSON.stringify({yes: 'ok', yup: 'ok', yeah: 'ok!'}))
    t.end()
  }

  collect('junk_rows.csv', {skipLines: 2}, verify)
})
